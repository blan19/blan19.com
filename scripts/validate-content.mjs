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
import matter from "gray-matter";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORIES = ["tech", "log"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const KNOWN_KEYS = ["publishedAt", "title", "tags", "description", "reference"];

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

// MDX 렌더러에 registerLanguage 된 언어만 하이라이트된다.
const loadHighlightLangs = () => {
  try {
    const src = fs.readFileSync(path.join(REPO_ROOT, "src/components/ui/mdx/index.tsx"), "utf8");
    const langs = [...src.matchAll(/registerLanguage\(\s*["']([^"']+)["']/g)].map((m) => m[1]);
    if (langs.length) return new Set(langs);
  } catch {
    // fall through
  }
  return new Set(["javascript", "jsx", "typescript", "tsx", "bash"]);
};
const HIGHLIGHT_LANGS = loadHighlightLangs();

// ---------- 문제 수집 ----------
const problems = [];
const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const error = (p, message) => problems.push({ path: rel(p), level: "error", message });
const warn = (p, message) => problems.push({ path: rel(p), level: "warn", message });

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
  // 렌더러(src/components/ui/mdx)와 같은 정규식: alt 에서 {…} 토큰을 지우고, 크기는 첫 {<숫자>x<숫자>} 토큰만 읽는다.
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
  const h3Seen = new Map();

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
      } else if (line.includes("###")) {
        warn(file, `${lineNo}행: 코드 블록 안의 "###" 가 목차(TOC)에 제목으로 잘못 잡힘`);
      }
      return;
    }

    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], len: fenceMatch[1].length };
      const lang = fenceMatch[2].trim().split(/\s+/)[0];
      if (!lang) {
        warn(file, `${lineNo}행: 언어가 지정되지 않은 코드 블록 → 하이라이트 없이 인라인 코드처럼 렌더됨`);
      } else if (!HIGHLIGHT_LANGS.has(lang)) {
        warn(file, `${lineNo}행: 코드 블록 언어 "${lang}" 은 MDX 렌더러에 등록되지 않아 하이라이트되지 않음 (등록: ${[...HIGHLIGHT_LANGS].join(", ")})`);
      }
      return;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      prevEndsBlock = true;
      const level = heading[1].length;
      const text = heading[2].trim();
      if (level !== 3 && level !== 4) {
        warn(file, `${lineNo}행: h${level} 제목은 스타일이 없음. 본문 제목은 ### (목차에 표시) 또는 #### 를 쓰세요`);
      }
      if (level === 3) {
        if (text.includes("#")) warn(file, `${lineNo}행: ### 제목에 "#" 이 있으면 목차에서 빠짐`);
        if (/[*_`[\]]/.test(text)) warn(file, `${lineNo}행: ### 제목의 마크다운 서식(굵게/코드/링크) 때문에 목차 링크와 앵커가 어긋날 수 있음`);
        if (h3Seen.has(text)) warn(file, `${lineNo}행: ### 제목 "${text}" 이 ${h3Seen.get(text)}행과 중복 → 앵커 id 충돌`);
        else h3Seen.set(text, lineNo);
      }
      return;
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
