#!/usr/bin/env node
// contents/ 아래 글(.mdx)의 구조와 frontmatter, 본문을 검사한다.
// 사용법:
//   node scripts/validate-content.mjs                 전체 글 검사
//   node scripts/validate-content.mjs <path>...       지정한 파일만 보고 (contents/ 밖 경로는 무시)
//   node scripts/validate-content.mjs --root <dir>    <dir>/contents 를 검사 (픽스처 테스트용)
// 출력: 문제마다 한 줄 `<path>: [error|warn] <message>`. error 가 하나라도 있으면 exit 1.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORIES = ["tech", "log"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const KNOWN_KEYS = ["publishedAt", "title", "tags", "description", "reference", "updatedAt"];
// updatedAt 의 "미래" 판정 기준. 글 날짜는 한국 시간 달력 날짜라 CI(UTC)에서도 같은 날로 본다.
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

// ---------- 인자 ----------
const argv = process.argv.slice(2);
let root = REPO_ROOT;
const targets = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--root") root = path.resolve(argv[++i] ?? ".");
  else if (argv[i].startsWith("--root=")) root = path.resolve(argv[i].slice(7));
  else targets.push(argv[i]);
}
// 심볼릭 링크(/tmp → /private/tmp 등)가 섞여도 경로 비교가 맞도록 실제 경로로 맞춘다.
const real = (p) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.join(real(path.dirname(p)), path.basename(p));
  }
};
root = real(root);
const CONTENTS = path.join(root, "contents");
// public/ 과 next.config.js 는 --root 에 없으면 repo 것을 쓴다.
const pick = (name) => (fs.existsSync(path.join(root, name)) ? path.join(root, name) : path.join(REPO_ROOT, name));
const PUBLIC_DIR = pick("public");

// ---------- 렌더러/설정과 동기화되는 값 ----------
const loadRemotePatterns = () => {
  try {
    const config = createRequire(import.meta.url)(pick("next.config.js"));
    return config?.images?.remotePatterns ?? [];
  } catch {
    return [];
  }
};
const REMOTE_PATTERNS = loadRemotePatterns();

// 글 렌더러(src/lib/markdown)가 아는 코드 블록 언어. languages.ts 의 배열과 별칭을 정규식으로 읽는다.
const LANGUAGES_FILE = path.join(REPO_ROOT, "src/lib/markdown/languages.ts");
const loadCodeLangs = () => {
  const langs = new Set();
  try {
    const src = fs.readFileSync(LANGUAGES_FILE, "utf8");
    for (const m of src.matchAll(/export const (CODE_LANGUAGES|PLAIN_LANGUAGES|DIAGRAM_LANGUAGES) = \[([\s\S]*?)\]/g)) {
      for (const name of m[2].matchAll(/"([^"]+)"/g)) langs.add(name[1].toLowerCase());
    }
    const aliases = src.match(/export const LANGUAGE_ALIASES[^=]*= \{([\s\S]*?)\}/);
    if (aliases) {
      for (const name of aliases[1].matchAll(/^\s*"([^"]+)"\s*:/gm)) langs.add(name[1].toLowerCase());
    }
  } catch {
    // 아래에서 error 로 보고한다
  }
  return langs;
};
const CODE_LANGS = loadCodeLangs();

// ---------- 문제 수집 ----------
const problems = [];
const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const error = (p, message) => problems.push({ path: rel(p), level: "error", message });
const warn = (p, message) => problems.push({ path: rel(p), level: "warn", message });

const CALLOUT_TYPES = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
// `> [!NOTE] 제목` 처럼 마커 뒤 같은 줄이 평문이면 마커와 한 텍스트 노드가 되어 일반 인용으로 렌더된다.
// `**굵게**`, `코드`, 링크처럼 별도 노드로 시작하면 텍스트 노드가 마커에서 끝나 콜아웃이 된다.
const isPlainTextAfterMarker = (line) => {
  const rest = line.replace(/^ {0,3}>\s*\[![A-Za-z]+\][ \t]*/, "");
  return rest.trim() !== "" && !/^(\*{1,2}[^\s*]|_{1,2}[^\s_]|`|!?\[|<|~{1,2}[^\s~])/.test(rest);
};
// 글 페이지(/tech/<slug>)에 고정으로 있는 id. rehype-slug 가 만든 제목 id 와 겹치면 앵커·목차·건너뛰기 링크가 엉뚱한 곳으로 간다.
// main: src/app/layout.tsx, post-head: ui/post-header, post-body: ui/post-body, footnote-label: remark-rehype 각주 제목,
// ref-label: ui/post-references, cm-label: ui/comment. 새 고정 id 를 넣으면 여기도 넣는다.
const FIXED_PAGE_IDS = ["main", "post-head", "post-body", "footnote-label", "ref-label", "rel-label", "cm-label"];
// rehype-slug 에 넘어가는 제목 텍스트(hast toString)를 마크다운 원문에서 근사한다: 닫는 #, 이미지, 링크/코드/강조 표시를 걷어 낸다.
const headingText = (raw) =>
  stripInlineCodeMarks(raw.replace(/[ \t]+#+[ \t]*$/, ""))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[\^([^\]\s]+)\]/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*{1,3}|~{1,2})/g, "")
    .replace(/\\(.)/g, "$1")
    .trim();
// 인라인 코드 안의 [^x] 는 각주가 아니다.
const stripInlineCode = (line) => line.replace(/(`+)[\s\S]*?\1/g, "");
const stripInlineCodeMarks = (line) => line.replace(/(`+)([\s\S]*?)\1/g, "$2");

const isRealDate = (s) => {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const globToRegExp = (glob, sep) => {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const single = sep === "." ? "[^.]+" : "[^/]+";
  return new RegExp(`^${escaped.replace(/\*\*/g, "\u0000").replace(/\*/g, single).replace(/\u0000/g, ".*")}$`);
};

const isAllowedRemote = (url) => {
  return REMOTE_PATTERNS.some((p) => {
    if (p.protocol && `${p.protocol}:` !== url.protocol) return false;
    if (!globToRegExp(p.hostname, ".").test(url.hostname)) return false;
    if (p.port && p.port !== url.port) return false;
    if (p.pathname && !globToRegExp(p.pathname, "/").test(url.pathname)) return false;
    return true;
  });
};

// ---------- frontmatter ----------
const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";

const checkFrontmatter = (file, data, folderDate) => {
  for (const key of Object.keys(data)) {
    if (!KNOWN_KEYS.includes(key)) warn(file, `알 수 없는 frontmatter 필드 "${key}" (사용 필드: ${KNOWN_KEYS.join(", ")})`);
  }

  if (!isNonEmptyString(data.title)) error(file, "title 이 없거나 비어 있음 (문자열 필요)");
  if (!isNonEmptyString(data.description)) error(file, "description 이 없거나 비어 있음 (문자열 필요)");

  const { publishedAt } = data;
  if (publishedAt === undefined) {
    error(file, 'publishedAt 이 없음 (예: publishedAt: "2024-05-15")');
  } else if (publishedAt instanceof Date) {
    error(file, 'publishedAt 이 따옴표 없이 쓰여 Date 로 파싱됨 → 화면 렌더 시 크래시. "YYYY-MM-DD" 처럼 따옴표로 감싸세요');
  } else if (typeof publishedAt !== "string" || !isRealDate(publishedAt)) {
    error(file, `publishedAt "${publishedAt}" 이 올바른 "YYYY-MM-DD" 날짜가 아님`);
  } else if (folderDate && publishedAt !== folderDate) {
    warn(file, `publishedAt(${publishedAt}) 과 폴더 날짜(${folderDate}) 가 다름. 목록 순서는 폴더 이름(readdirSync 순서)을 따름`);
  }

  // 선택 필드(없으면 publishedAt 을 수정일로 쓴다). 내용이 실질적으로 바뀐 경우에만 쓴다.
  // JSON-LD dateModified, og modifiedTime, sitemap lastmod, 글 머리 "수정" 날짜에 쓰인다.
  const { updatedAt } = data;
  if (updatedAt === undefined) {
    // 선택 필드
  } else if (updatedAt instanceof Date) {
    error(file, 'updatedAt 이 따옴표 없이 쓰여 Date 로 파싱됨 → 화면 렌더 시 크래시. "YYYY-MM-DD" 처럼 따옴표로 감싸세요');
  } else if (typeof updatedAt !== "string" || !isRealDate(updatedAt)) {
    error(file, `updatedAt "${updatedAt}" 이 올바른 "YYYY-MM-DD" 날짜가 아님`);
  } else if (typeof publishedAt === "string" && isRealDate(publishedAt) && updatedAt < publishedAt) {
    error(file, `updatedAt(${updatedAt}) 이 publishedAt(${publishedAt}) 보다 이름`);
  } else if (updatedAt > TODAY) {
    error(file, `updatedAt(${updatedAt}) 이 오늘(${TODAY}, 한국 시간) 이후의 날짜임`);
  }

  const { tags } = data;
  if (!Array.isArray(tags) || tags.length === 0) {
    error(file, 'tags 는 비어 있지 않은 문자열 배열이어야 함 (예: tags: ["react.js"])');
  } else {
    if (!tags.every(isNonEmptyString)) error(file, "tags 의 모든 항목은 비어 있지 않은 문자열이어야 함");
    if (new Set(tags).size !== tags.length) warn(file, "tags 에 중복 항목이 있음");
  }

  const { reference } = data;
  if (reference === undefined) {
    error(file, "reference 가 없음 (참고 링크가 없으면 reference: [] 로 두세요)");
  } else if (!Array.isArray(reference)) {
    error(file, "reference 는 URL 문자열 배열이어야 함");
  } else {
    for (const ref of reference) {
      let ok = false;
      try {
        ok = typeof ref === "string" && /^https?:$/.test(new URL(ref).protocol);
      } catch {
        ok = false;
      }
      if (!ok) error(file, `reference 항목 "${ref}" 이 http(s) URL 이 아님`);
    }
    if (new Set(reference).size !== reference.length) warn(file, "reference 에 중복 URL 이 있음 (React key 중복)");
  }
};

// ---------- 본문 ----------
// ![alt](url "title") / ![alt](<url with space>)
const IMAGE_RE = /!\[([^\]]*)\]\(\s*(?:<([^>\n]*)>|([^)\s]+))(?:\s+"[^"]*")?\s*\)/g;
const IMAGE_REF_RE = /!\[[^\]]*\]\[[^\]]*\]/;
const META_TOKEN_RE = /\{[^}]*\}/g;

const checkImageMeta = (file, lineNo, alt) => {
  const where = `${lineNo}행 이미지`;
  if ((alt.match(/\{/g) ?? []).length !== (alt.match(/\}/g) ?? []).length) {
    error(file, `${where}: alt 의 중괄호 { } 짝이 맞지 않음 ("${alt}")`);
    return;
  }
  if (/\{[^}]*\{/.test(alt)) {
    error(file, `${where}: alt 메타 안에 중괄호가 중첩됨. 렌더러가 alt 와 caption 을 잘못 자른다 ("${alt}")`);
    return;
  }
  for (const token of alt.match(META_TOKEN_RE) ?? []) {
    const ok = /^\{priority\}$/i.test(token) || /^\{caption: .+\}$/.test(token) || /^\{\d+x\d+\}$/.test(token);
    if (ok) continue;
    if (/^\{caption/i.test(token)) warn(file, `${where}: 캡션 형식이 틀려 빈 캡션이 렌더됨 ${token} (형식: {caption: 텍스트}, 소문자, 콜론 뒤 공백 하나)`);
    else warn(file, `${where}: 알 수 없는 alt 메타 ${token} (허용: {priority}, {caption: 설명}, {768x432}. 그 외 토큰은 무시됨)`);
  }
  // 렌더러(src/lib/markdown/rehype-image-figures.ts)와 같은 정규식: alt 에서 {…} 토큰을 지우고, 크기는 첫 {<숫자>x<숫자>} 토큰만 읽는다.
  if (alt.replace(/\s*\{[^}]*\}/g, "").trim() === "") {
    error(file, `${where}: alt 설명 텍스트가 없음 (예: ![설명 {768x432}](...))`);
  }
  const sizes = alt.match(/\{\d+x\d+\}/g) ?? [];
  if (sizes[0] && /^\{0+x|x0+\}$/.test(sizes[0])) error(file, `${where}: 크기 ${sizes[0]} 에 0 이 있음 → next/image 에 width/height 0 이 넘어감`);
  if (sizes.length > 1) warn(file, `${where}: 크기 토큰이 ${sizes.length}개임. 렌더러는 첫 ${sizes[0]} 만 쓴다`);
};

const checkImageSrc = (file, lineNo, src) => {
  const where = `${lineNo}행 이미지`;
  if (/^https?:\/\//.test(src)) {
    let url;
    try {
      url = new URL(src);
    } catch {
      error(file, `${where}: 잘못된 URL "${src}"`);
      return;
    }
    if (!isAllowedRemote(url)) {
      const hosts = REMOTE_PATTERNS.map((p) => p.hostname).join(", ");
      error(file, `${where}: ${url.protocol}//${url.hostname} 는 next.config.js images.remotePatterns 에 없음 (허용: ${hosts})`);
    }
  } else if (src.startsWith("/")) {
    const local = path.join(PUBLIC_DIR, decodeURIComponent(src.split(/[?#]/)[0]));
    if (!fs.existsSync(local)) error(file, `${where}: public${src} 파일이 없음`);
  } else {
    error(file, `${where}: 이미지 경로 "${src}" 는 https URL 이거나 public 기준 절대경로(/image/...) 여야 함`);
  }
};

const checkTechBody = (file, body, bodyStartLine) => {
  const lines = body.split("\n");
  let fence = null; // { char, len }
  const footnoteRefs = new Map(); // id → 첫 참조 행
  const footnoteDefs = new Map(); // id → 정의 행
  const slugger = new GithubSlugger(); // 렌더러의 rehype-slug 와 같은 순서로 제목 id 를 만든다(중복이면 -1, -2)

  // 이전 줄이 빈 줄, 제목, 닫는 코드 펜스, 수평선이면 이 줄에서 새 문단이 시작된다(remark 와 같은 기준).
  let prevEndsBlock = true;

  lines.forEach((line, i) => {
    const lineNo = bodyStartLine + i;
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    const startsBlock = prevEndsBlock;
    prevEndsBlock = line.trim() === "" || /^ {0,3}([-*_])( *\1){2,} *$/.test(line);

    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence.char && fenceMatch[1].length >= fence.len && fenceMatch[2].trim() === "") {
        fence = null;
        prevEndsBlock = true;
      }
      return;
    }

    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], len: fenceMatch[1].length };
      const info = fenceMatch[2].trim();
      const lang = info.split(/\s+/)[0].toLowerCase();
      if (!lang) {
        warn(file, `${lineNo}행: 언어가 지정되지 않은 코드 블록 → 하이라이트 없이 text 로 렌더됨`);
      } else if (!CODE_LANGS.has(lang)) {
        warn(file, `${lineNo}행: 코드 블록 언어 "${lang}" 는 하이라이트되지 않음 (지원: ${[...CODE_LANGS].join(", ")})`);
      }
      if (/\btitle=/.test(info) && !/\btitle="[^"]*"/.test(info)) {
        warn(file, `${lineNo}행: 코드 블록 title 은 title="파일명" 형식이어야 함 (현재: ${info})`);
      }
      return;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      prevEndsBlock = true;
      const level = heading[1].length;
      const id = slugger.slug(headingText(heading[2]));
      if (FIXED_PAGE_IDS.includes(id)) {
        warn(file, `${lineNo}행: 제목의 앵커 id "${id}" 가 페이지 고정 id 와 겹침 → 링크·목차가 다른 요소로 감. 제목 문구를 바꾸세요 (고정 id: ${FIXED_PAGE_IDS.join(", ")})`);
      }
      if (level <= 2) {
        warn(file, `${lineNo}행: \`#\`/\`##\` 는 \`###\`(h2)와 같게 렌더됨. 섹션은 \`###\`, 하위는 \`####\` 를 쓰세요`);
      } else if (level >= 5) {
        warn(file, `${lineNo}행: \`#####\` 이하는 목차에 나오지 않음`);
      }
      return;
    }

    const callout = line.match(/^ {0,3}>\s*\[!([A-Za-z]+)\]/);
    if (callout && !CALLOUT_TYPES.includes(callout[1].toUpperCase())) {
      warn(file, `${lineNo}행: 알 수 없는 콜아웃 타입 [!${callout[1]}] → 일반 인용으로 렌더됨 (지원: ${CALLOUT_TYPES.join(", ")})`);
    } else if (callout && isPlainTextAfterMarker(line)) {
      // 렌더러(remark-alerts.ts)는 마커가 든 첫 텍스트 노드에서 마커 뒤가 줄바꿈(또는 노드 끝)이어야 콜아웃으로 바꾼다.
      warn(file, `${lineNo}행: [!${callout[1]}] 마커 뒤 같은 줄에 텍스트가 있으면 일반 인용으로 렌더됨. 제목은 다음 줄에 **제목** 으로`);
    }

    const plain = stripInlineCode(line);
    const definition = plain.match(/^ {0,3}\[\^([^\]\s]+)\]:/);
    // remark-gfm 은 각주 라벨을 대소문자 구분 없이 맞춘다([^A] ↔ [^a]:). 키는 소문자, 값에 원래 표기를 둔다.
    if (definition && !footnoteDefs.has(definition[1].toLowerCase())) {
      footnoteDefs.set(definition[1].toLowerCase(), { id: definition[1], lineNo });
    }
    const refSource = definition ? plain.slice(definition[0].length) : plain;
    for (const ref of refSource.matchAll(/\[\^([^\]\s]+)\](?!:)/g)) {
      if (!footnoteRefs.has(ref[1].toLowerCase())) footnoteRefs.set(ref[1].toLowerCase(), { id: ref[1], lineNo });
    }

    if (IMAGE_REF_RE.test(line)) {
      warn(file, `${lineNo}행: 참조 형식 이미지(![설명][ref])는 검사기가 확인하지 못함. ![설명](URL) 형식을 쓰세요`);
    }
    for (const match of line.matchAll(IMAGE_RE)) {
      const [whole, alt] = match;
      const src = match[2] ?? match[3];
      const startsParagraph = line.trimStart().startsWith(whole) && startsBlock;
      if (!startsParagraph) {
        warn(file, `${lineNo}행: 문단 중간의 이미지는 next/image 로 렌더되지 않음. 이미지 앞뒤에 빈 줄을 두세요`);
        continue;
      }
      const restOfLine = line.trim().slice(whole.length).trim();
      const nextLine = lines[i + 1] ?? "";
      if (restOfLine !== "" || nextLine.trim() !== "") {
        error(file, `${lineNo}행: 이미지로 시작하는 문단의 나머지 텍스트는 렌더되지 않고 사라짐. 이미지 다음에 빈 줄을 두세요`);
      }
      checkImageMeta(file, lineNo, alt);
      checkImageSrc(file, lineNo, src);
    }
  });

  if (fence) warn(file, "닫히지 않은 코드 블록이 있음");

  for (const [key, { id, lineNo }] of footnoteRefs) {
    if (!footnoteDefs.has(key)) warn(file, `${lineNo}행: 각주 [^${id}] 의 정의([^${id}]: …)가 없음 → 각주로 렌더되지 않고 글자 그대로 보임`);
  }
  for (const [key, { id, lineNo }] of footnoteDefs) {
    if (!footnoteRefs.has(key)) warn(file, `${lineNo}행: 각주 정의 [^${id}] 를 참조하는 곳이 없음 → 렌더되지 않음`);
  }
};

const checkLogBody = (file, body) => {
  // 제목, 코드 블록, 이미지, 목록, 굵게/기울임, 링크, 인라인 코드, 인용
  if (/^ {0,3}(```|~~~|#{1,6}\s|[-*+]\s|\d+[.)]\s|>)|!?\[[^\]]*\]\(|\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`/m.test(body)) {
    warn(file, "log 글은 마크다운을 렌더하지 않고 원문 그대로 출력됨 (제목/코드/이미지/목록/강조/링크/인용 문법이 그대로 보임)");
  }
};

// 초안의 확인 필요 표시. 그대로 공개되므로 커밋 전에 모두 해소해야 한다. 로컬은 warn, CI 는 error.
// 코드 블록 안(코드 예시의 // TODO: 주석)은 검사하지 않는다.
const checkTodo = (file, raw) => {
  const report = process.env.CI ? error : warn;
  let fence = null;
  raw.split("\n").forEach((line, i) => {
    const f = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (f && f[1][0] === fence.char && f[1].length >= fence.len && f[2].trim() === "") fence = null;
      return;
    }
    if (f) {
      fence = { char: f[1][0], len: f[1].length };
      return;
    }
    if (/\bTODO:/.test(line)) report(file, `${i + 1}행: 해소되지 않은 TODO: 가 있음 (커밋 전에 채우거나 지우세요)`);
  });
};

// ---------- 파일/폴더 구조 ----------
const posts = []; // { file, category, slug, description }

const checkPost = (file, category, folderDate) => {
  const slug = path.basename(file, ".mdx");
  if (!SLUG_RE.test(slug)) {
    error(file, `파일명(slug) "${slug}" 은 소문자 영문/숫자/./- 만 쓸 수 있음 (slug 가 곧 URL 이자 조회수 키)`);
  }

  const raw = fs.readFileSync(file, "utf8");
  if (!raw.startsWith("---")) {
    error(file, "파일 맨 앞에 --- 로 시작하는 frontmatter 가 없음");
  }
  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    error(file, `frontmatter YAML 파싱 실패: ${e.message.split("\n")[0]}`);
    return;
  }
  const data = parsed.data ?? {};
  checkFrontmatter(file, data, folderDate);

  const bodyStartLine = raw.slice(0, raw.length - parsed.content.length).split("\n").length;
  if (parsed.content.trim() === "") warn(file, "본문이 비어 있음");
  checkTodo(file, raw);
  if (category === "log") checkLogBody(file, parsed.content);
  else checkTechBody(file, parsed.content, bodyStartLine);

  posts.push({ file, category, slug, description: typeof data.description === "string" ? data.description.trim() : "" });
};

const listDir = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

const scan = () => {
  if (!fs.existsSync(CONTENTS)) {
    error(CONTENTS, "contents 디렉터리가 없음");
    return;
  }
  for (const entry of listDir(CONTENTS)) {
    if (entry.name.startsWith(".")) continue;
    if (!entry.isDirectory() || !CATEGORIES.includes(entry.name)) {
      warn(path.join(CONTENTS, entry.name), `contents/ 에는 ${CATEGORIES.join(", ")} 디렉터리만 읽힘`);
    }
  }

  for (const category of CATEGORIES) {
    const categoryDir = path.join(CONTENTS, category);
    if (!fs.existsSync(categoryDir)) continue;

    for (const entry of listDir(categoryDir)) {
      const entryPath = path.join(categoryDir, entry.name);
      if (!entry.isDirectory()) {
        error(entryPath, `contents/${category}/ 바로 아래에는 날짜 폴더만 둘 수 있음 (파일이 있으면 모든 페이지가 ENOTDIR 로 깨짐). 형식: contents/${category}/YYYY-MM-DD/<slug>.mdx`);
        continue;
      }
      if (!isRealDate(entry.name)) {
        error(entryPath, `폴더 이름 "${entry.name}" 이 올바른 YYYY-MM-DD 날짜가 아님`);
      }

      const children = listDir(entryPath);
      const mdx = children.filter((c) => c.isFile() && c.name.endsWith(".mdx"));
      for (const c of children) {
        if (c.name === ".DS_Store" || (c.isFile() && c.name.endsWith(".mdx"))) continue;
        warn(path.join(entryPath, c.name), c.isDirectory() ? "날짜 폴더 안의 하위 폴더는 읽히지 않음" : "날짜 폴더 안의 .mdx 가 아닌 파일은 무시됨");
      }
      if (mdx.length === 0) {
        error(entryPath, "날짜 폴더에 .mdx 파일이 없음 (EISDIR 로 모든 페이지가 깨짐)");
        continue;
      }
      if (mdx.length > 1) {
        for (const c of mdx) {
          error(path.join(entryPath, c.name), `날짜 폴더 하나에는 .mdx 가 정확히 1개여야 함 (현재 ${mdx.length}개 → 로더가 파일명을 이어 붙여 ENOENT 로 모든 페이지가 깨짐). 같은 날 두 번째 글은 다른 날짜 폴더에 두세요`);
        }
      }
      for (const c of mdx) checkPost(path.join(entryPath, c.name), category, entry.name);
    }
  }

  // slug 중복 (카테고리와 무관하게: 조회수 키가 slug 하나다)
  const bySlug = new Map();
  for (const p of posts) {
    bySlug.set(p.slug, [...(bySlug.get(p.slug) ?? []), p]);
  }
  for (const group of bySlug.values()) {
    if (group.length < 2) continue;
    for (const p of group) {
      const others = group.filter((o) => o !== p).map((o) => rel(o.file)).join(", ");
      error(p.file, `slug "${p.slug}" 이 중복됨 (${others})`);
    }
  }

  // description 복붙 의심
  const byDesc = new Map();
  for (const p of posts) {
    if (!p.description) continue;
    byDesc.set(p.description, [...(byDesc.get(p.description) ?? []), p]);
  }
  for (const group of byDesc.values()) {
    if (group.length < 2) continue;
    for (const p of group) {
      const others = group.filter((o) => o !== p).map((o) => rel(o.file)).join(", ");
      warn(p.file, `description 이 다른 글과 같음 (${others})`);
    }
  }
};

// ---------- 실행 ----------
if (CODE_LANGS.size === 0) {
  error(LANGUAGES_FILE, "src/lib/markdown/languages.ts 에서 코드 언어 목록을 읽지 못함");
}
scan();

let reported = problems;
let scope = `글 ${posts.length}개`;
if (targets.length > 0) {
  const wanted = targets
    .map((t) => rel(real(path.resolve(t))))
    .filter((t) => t === "contents" || t.startsWith("contents/"));
  if (wanted.length === 0) process.exit(0);
  reported = problems.filter((p) => wanted.some((w) => w === p.path || w.startsWith(`${p.path}/`) || p.path.startsWith(`${w}/`)));
  scope = `지정 파일 ${wanted.length}개`;
}

const order = { error: 0, warn: 1 };
reported.sort((a, b) => a.path.localeCompare(b.path) || order[a.level] - order[b.level]);
for (const p of reported) console.log(`${p.path}: [${p.level}] ${p.message}`);

const errors = reported.filter((p) => p.level === "error").length;
const warns = reported.length - errors;
console.log(`콘텐츠 검사 (${scope}): error ${errors}개, warn ${warns}개${errors ? " → 실패" : ""}`);
process.exit(errors ? 1 : 0);
