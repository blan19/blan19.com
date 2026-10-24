// frontmatter 파싱과 필드 검사. 순수 함수(파일 시스템 없음).
import matter from "gray-matter";
import { error, warn } from "./problem.mjs";

export const KNOWN_KEYS = ["publishedAt", "title", "tags", "description", "reference", "updatedAt"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isRealDate = (s) => {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

// gray-matter 는 `---js` frontmatter 를 eval 한다. 검사만 하는 단계에서 코드가 돌지 않도록 막는다(`js` 별칭도 이 키로 간다).
const MATTER_OPTIONS = {
  engines: {
    javascript: () => {
      throw new Error("JS frontmatter(---js) 는 허용하지 않음. YAML 만 쓰세요");
    },
  },
};

// 결과: { data, content, bodyStartLine, problems }. 파싱에 실패하면 data 가 null 이다.
export const parseFrontmatter = (raw) => {
  const problems = [];
  if (!raw.startsWith("---")) {
    problems.push(error("파일 맨 앞에 --- 로 시작하는 frontmatter 가 없음"));
  } else if (!/^---[ \t]*\r?\n/.test(raw)) {
    // ---js 등. 파싱하지 않는다(MATTER_OPTIONS 는 2차 방어선).
    problems.push(error("frontmatter 는 YAML 만 허용 (첫 줄은 --- 만)"));
    return { data: null, content: "", bodyStartLine: 1, problems };
  }
  let parsed;
  try {
    parsed = matter(raw, MATTER_OPTIONS);
  } catch (e) {
    problems.push(error(`frontmatter YAML 파싱 실패: ${e.message.split("\n")[0]}`));
    return { data: null, content: "", bodyStartLine: 1, problems };
  }
  const bodyStartLine = raw.slice(0, raw.length - parsed.content.length).split("\n").length;
  return { data: parsed.data ?? {}, content: parsed.content, bodyStartLine, problems };
};

// updatedAt 의 "미래" 판정 기준. 글 날짜는 한국 시간 달력 날짜라 CI(UTC)에서도 같은 날로 본다.
export const todayInSeoul = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";

export const checkFrontmatter = (data, folderDate, today = todayInSeoul()) => {
  const out = [];
  for (const key of Object.keys(data)) {
    if (!KNOWN_KEYS.includes(key)) out.push(warn(`알 수 없는 frontmatter 필드 "${key}" (사용 필드: ${KNOWN_KEYS.join(", ")})`));
  }

  if (!isNonEmptyString(data.title)) out.push(error("title 이 없거나 비어 있음 (문자열 필요)"));
  if (!isNonEmptyString(data.description)) out.push(error("description 이 없거나 비어 있음 (문자열 필요)"));

  const { publishedAt } = data;
  if (publishedAt === undefined) {
    out.push(error('publishedAt 이 없음 (예: publishedAt: "2024-05-15")'));
  } else if (publishedAt instanceof Date) {
    out.push(error('publishedAt 이 따옴표 없이 쓰여 Date 로 파싱됨 → 화면 렌더 시 크래시. "YYYY-MM-DD" 처럼 따옴표로 감싸세요'));
  } else if (typeof publishedAt !== "string" || !isRealDate(publishedAt)) {
    out.push(error(`publishedAt "${publishedAt}" 이 올바른 "YYYY-MM-DD" 날짜가 아님`));
  } else if (folderDate && publishedAt !== folderDate) {
    out.push(warn(`publishedAt(${publishedAt}) 과 폴더 날짜(${folderDate}) 가 다름. 목록 순서는 폴더 이름(readdirSync 순서)을 따름`));
  }

  // 선택 필드(없으면 publishedAt 을 수정일로 쓴다). 내용이 실질적으로 바뀐 경우에만 쓴다.
  // JSON-LD dateModified, og modifiedTime, sitemap lastmod, 글 머리 "수정" 날짜에 쓰인다.
  const { updatedAt } = data;
  if (updatedAt === undefined) {
    // 선택 필드
  } else if (updatedAt instanceof Date) {
    out.push(error('updatedAt 이 따옴표 없이 쓰여 Date 로 파싱됨 → 화면 렌더 시 크래시. "YYYY-MM-DD" 처럼 따옴표로 감싸세요'));
  } else if (typeof updatedAt !== "string" || !isRealDate(updatedAt)) {
    out.push(error(`updatedAt "${updatedAt}" 이 올바른 "YYYY-MM-DD" 날짜가 아님`));
  } else if (typeof publishedAt === "string" && isRealDate(publishedAt) && updatedAt < publishedAt) {
    out.push(error(`updatedAt(${updatedAt}) 이 publishedAt(${publishedAt}) 보다 이름`));
  } else if (updatedAt > today) {
    out.push(error(`updatedAt(${updatedAt}) 이 오늘(${today}, 한국 시간) 이후의 날짜임`));
  }

  const { tags } = data;
  if (!Array.isArray(tags) || tags.length === 0) {
    out.push(error('tags 는 비어 있지 않은 문자열 배열이어야 함 (예: tags: ["react.js"])'));
  } else {
    if (!tags.every(isNonEmptyString)) out.push(error("tags 의 모든 항목은 비어 있지 않은 문자열이어야 함"));
    if (new Set(tags).size !== tags.length) out.push(warn("tags 에 중복 항목이 있음"));
  }

  const { reference } = data;
  if (reference === undefined) {
    out.push(error("reference 가 없음 (참고 링크가 없으면 reference: [] 로 두세요)"));
  } else if (!Array.isArray(reference)) {
    out.push(error("reference 는 URL 문자열 배열이어야 함"));
  } else {
    for (const ref of reference) {
      let ok = false;
      try {
        ok = typeof ref === "string" && /^https?:$/.test(new URL(ref).protocol);
      } catch {
        ok = false;
      }
      if (!ok) out.push(error(`reference 항목 "${ref}" 이 http(s) URL 이 아님`));
    }
    if (new Set(reference).size !== reference.length) out.push(warn("reference 에 중복 URL 이 있음 (React key 중복)"));
  }
  return out;
};
