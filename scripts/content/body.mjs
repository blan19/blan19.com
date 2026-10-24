// 본문 검사(tech 는 렌더러 규칙, log 는 원문 출력, 공통 TODO). ctx: { langs, remotePatterns, remoteError, publicDir }.
import GithubSlugger from "github-slugger";
import { error, warn } from "./problem.mjs";
import { importTs } from "../lib/import-ts.mjs";
import { IMAGE_RE, IMAGE_REF_RE, checkImageMeta, checkImageSrc } from "./images.mjs";

export const CALLOUT_TYPES = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
// 글 페이지(/tech/<slug>)에 고정으로 있는 id. rehype-slug 가 만든 제목 id 와 겹치면 앵커·목차·건너뛰기 링크가 엉뚱한 곳으로 간다.
// 원본은 src/lib/page-ids.ts(레이아웃과 컴포넌트가 같은 값을 쓴다).
const { PAGE_IDS } = await importTs("src/lib/page-ids.ts");
export const FIXED_PAGE_IDS = Object.values(PAGE_IDS);

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const closesFence = (m, fence) => m && m[1][0] === fence.char && m[1].length >= fence.len && m[2].trim() === "";

// `> [!NOTE] 제목` 처럼 마커 뒤 같은 줄이 평문이면 마커와 한 텍스트 노드가 되어 일반 인용으로 렌더된다.
// `**굵게**`, `코드`, 링크처럼 별도 노드로 시작하면 텍스트 노드가 마커에서 끝나 콜아웃이 된다.
const isPlainTextAfterMarker = (line) => {
  const rest = line.replace(/^ {0,3}>\s*\[![A-Za-z]+\][ \t]*/, "");
  return rest.trim() !== "" && !/^(\*{1,2}[^\s*]|_{1,2}[^\s_]|`|!?\[|<|~{1,2}[^\s~])/.test(rest);
};
// 인라인 코드 안의 [^x] 는 각주가 아니다.
const stripInlineCode = (line) => line.replace(/(`+)[\s\S]*?\1/g, "");
const stripInlineCodeMarks = (line) => line.replace(/(`+)([\s\S]*?)\1/g, "$2");
// rehype-slug 에 넘어가는 제목 텍스트(hast toString)를 마크다운 원문에서 근사한다: 닫는 #, 이미지, 링크/코드/강조 표시를 걷어 낸다.
const headingText = (raw) =>
  stripInlineCodeMarks(raw.replace(/[ \t]+#+[ \t]*$/, ""))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[\^([^\]\s]+)\]/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*{1,3}|~{1,2})/g, "")
    .replace(/\\(.)/g, "$1")
    .trim();

// 코드 블록 언어는 렌더러와 같은 normalizeLanguage(src/lib/markdown/languages.ts)로 판정한다.
const checkFenceLang = (lineNo, lang, langs) => {
  if (!lang) return [warn(`${lineNo}행: 언어가 지정되지 않은 코드 블록 → 하이라이트 없이 text 로 렌더됨`)];
  if (!langs) return []; // 목록을 못 읽은 경우는 CLI 가 따로 error 로 보고한다.
  if (langs.normalizeLanguage(lang).kind !== "plain" || langs.PLAIN_LANGUAGES.includes(lang)) return [];
  const supported = [...langs.CODE_LANGUAGES, ...langs.PLAIN_LANGUAGES, ...langs.DIAGRAM_LANGUAGES, ...Object.keys(langs.LANGUAGE_ALIASES)];
  return [warn(`${lineNo}행: 코드 블록 언어 "${lang}" 는 하이라이트되지 않음 (지원: ${supported.join(", ")})`)];
};

export const checkTechBody = (body, bodyStartLine, ctx) => {
  const out = [];
  const lines = body.split("\n");
  let fence = null; // { char, len }
  const footnoteRefs = new Map(); // id → 첫 참조 행
  const footnoteDefs = new Map(); // id → 정의 행
  const slugger = new GithubSlugger(); // 렌더러의 rehype-slug 와 같은 순서로 제목 id 를 만든다(중복이면 -1, -2)

  // 이전 줄이 빈 줄, 제목, 닫는 코드 펜스, 수평선이면 이 줄에서 새 문단이 시작된다(remark 와 같은 기준).
  let prevEndsBlock = true;

  lines.forEach((line, i) => {
    const lineNo = bodyStartLine + i;
    const fenceMatch = line.match(FENCE_RE);
    const startsBlock = prevEndsBlock;
    prevEndsBlock = line.trim() === "" || /^ {0,3}([-*_])( *\1){2,} *$/.test(line);

    if (fence) {
      if (closesFence(fenceMatch, fence)) {
        fence = null;
        prevEndsBlock = true;
      }
      return;
    }

    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], len: fenceMatch[1].length };
      const info = fenceMatch[2].trim();
      out.push(...checkFenceLang(lineNo, info.split(/\s+/)[0].toLowerCase(), ctx.langs));
      if (/\btitle=/.test(info) && !/\btitle="[^"]*"/.test(info)) {
        out.push(warn(`${lineNo}행: 코드 블록 title 은 title="파일명" 형식이어야 함 (현재: ${info})`));
      }
      return;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      prevEndsBlock = true;
      const level = heading[1].length;
      const id = slugger.slug(headingText(heading[2]));
      if (FIXED_PAGE_IDS.includes(id)) {
        out.push(warn(`${lineNo}행: 제목의 앵커 id "${id}" 가 페이지 고정 id 와 겹침 → 링크·목차가 다른 요소로 감. 제목 문구를 바꾸세요 (고정 id: ${FIXED_PAGE_IDS.join(", ")})`));
      }
      if (level <= 2) {
        out.push(warn(`${lineNo}행: \`#\`/\`##\` 는 \`###\`(h2)와 같게 렌더됨. 섹션은 \`###\`, 하위는 \`####\` 를 쓰세요`));
      } else if (level >= 5) {
        out.push(warn(`${lineNo}행: \`#####\` 이하는 목차에 나오지 않음`));
      }
      return;
    }

    const callout = line.match(/^ {0,3}>\s*\[!([A-Za-z]+)\]/);
    if (callout && !CALLOUT_TYPES.includes(callout[1].toUpperCase())) {
      out.push(warn(`${lineNo}행: 알 수 없는 콜아웃 타입 [!${callout[1]}] → 일반 인용으로 렌더됨 (지원: ${CALLOUT_TYPES.join(", ")})`));
    } else if (callout && isPlainTextAfterMarker(line)) {
      // 렌더러(remark-alerts.ts)는 마커가 든 첫 텍스트 노드에서 마커 뒤가 줄바꿈(또는 노드 끝)이어야 콜아웃으로 바꾼다.
      out.push(warn(`${lineNo}행: [!${callout[1]}] 마커 뒤 같은 줄에 텍스트가 있으면 일반 인용으로 렌더됨. 제목은 다음 줄에 **제목** 으로`));
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
      out.push(warn(`${lineNo}행: 참조 형식 이미지(![설명][ref])는 검사기가 확인하지 못함. ![설명](URL) 형식을 쓰세요`));
    }
    for (const match of line.matchAll(IMAGE_RE)) {
      const [whole, alt] = match;
      const src = match[2] ?? match[3];
      const startsParagraph = line.trimStart().startsWith(whole) && startsBlock;
      if (!startsParagraph) {
        out.push(warn(`${lineNo}행: 문단 중간의 이미지는 next/image 로 렌더되지 않음. 이미지 앞뒤에 빈 줄을 두세요`));
        continue;
      }
      const restOfLine = line.trim().slice(whole.length).trim();
      const nextLine = lines[i + 1] ?? "";
      if (restOfLine !== "" || nextLine.trim() !== "") {
        out.push(error(`${lineNo}행: 이미지로 시작하는 문단의 나머지 텍스트는 렌더되지 않고 사라짐. 이미지 다음에 빈 줄을 두세요`));
      }
      out.push(...checkImageMeta(lineNo, alt), ...checkImageSrc(lineNo, src, ctx));
    }
  });

  if (fence) out.push(warn("닫히지 않은 코드 블록이 있음"));

  for (const [key, { id, lineNo }] of footnoteRefs) {
    if (!footnoteDefs.has(key)) out.push(warn(`${lineNo}행: 각주 [^${id}] 의 정의([^${id}]: …)가 없음 → 각주로 렌더되지 않고 글자 그대로 보임`));
  }
  for (const [key, { id, lineNo }] of footnoteDefs) {
    if (!footnoteRefs.has(key)) out.push(warn(`${lineNo}행: 각주 정의 [^${id}] 를 참조하는 곳이 없음 → 렌더되지 않음`));
  }
  return out;
};

export const checkLogBody = (body) => {
  // 제목, 코드 블록, 이미지, 목록, 굵게/기울임, 링크, 인라인 코드, 인용
  if (/^ {0,3}(```|~~~|#{1,6}\s|[-*+]\s|\d+[.)]\s|>)|!?\[[^\]]*\]\(|\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`/m.test(body)) {
    return [warn("log 글은 마크다운을 렌더하지 않고 원문 그대로 출력됨 (제목/코드/이미지/목록/강조/링크/인용 문법이 그대로 보임)")];
  }
  return [];
};

// 초안의 확인 필요 표시. 그대로 공개되므로 커밋 전에 모두 해소해야 한다.
// 편집 중 검사(post-edit 훅, content:check)는 warn, strict(verify 와 CI)는 error. 코드 블록 안(코드 예시의 // TODO: 주석)은 검사하지 않는다.
export const checkTodo = (raw, strict) => {
  const report = strict ? error : warn;
  const out = [];
  let fence = null;
  raw.split("\n").forEach((line, i) => {
    const f = line.match(FENCE_RE);
    if (fence) {
      if (closesFence(f, fence)) fence = null;
      return;
    }
    if (f) {
      fence = { char: f[1][0], len: f[1].length };
      return;
    }
    if (/\bTODO:/.test(line)) out.push(report(`${i + 1}행: 해소되지 않은 TODO: 가 있음 (커밋 전에 채우거나 지우세요)`));
  });
  return out;
};
