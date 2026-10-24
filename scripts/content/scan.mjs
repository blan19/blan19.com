// contents/ 의 폴더 구조를 돌며 글마다 검사하고, 글 사이 규칙(slug, description 중복)을 본다.
// 결과: { problems: [{ file, level, message }], posts: [{ file, category, slug, description }] }
import fs from "node:fs";
import path from "node:path";
import { checkLogBody, checkTechBody, checkTodo } from "./body.mjs";
import { checkFrontmatter, isRealDate, parseFrontmatter } from "./frontmatter.mjs";
import { error, warn } from "./problem.mjs";

export const CATEGORIES = ["tech", "log"];
const SLUG_RE = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

const listDir = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

// 파일 하나: 파일명, frontmatter, 본문. 결과: { problems, post | null }
export const checkPost = (file, category, folderDate, ctx, { strict = false } = {}) => {
  const problems = [];
  const slug = path.basename(file, ".mdx");
  if (!SLUG_RE.test(slug)) {
    problems.push(error(`파일명(slug) "${slug}" 은 소문자 영문/숫자/./- 만 쓸 수 있음 (slug 가 곧 URL 이자 조회수 키)`));
  }

  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseFrontmatter(raw);
  problems.push(...parsed.problems);
  if (!parsed.data) return { problems, post: null };

  problems.push(...checkFrontmatter(parsed.data, folderDate));
  if (parsed.content.trim() === "") problems.push(warn("본문이 비어 있음"));
  problems.push(...checkTodo(raw, strict));
  if (category === "log") problems.push(...checkLogBody(parsed.content));
  else problems.push(...checkTechBody(parsed.content, parsed.bodyStartLine, ctx));

  const description = typeof parsed.data.description === "string" ? parsed.data.description.trim() : "";
  return { problems, post: { file, category, slug, description } };
};

// 같은 key 를 가진 글이 둘 이상이면 각 글에 다른 글 목록과 함께 보고한다.
const duplicates = (posts, key, make, rel) => {
  const groups = new Map();
  for (const p of posts) {
    if (!key(p)) continue;
    groups.set(key(p), [...(groups.get(key(p)) ?? []), p]);
  }
  const out = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const p of group) {
      const others = group.filter((o) => o !== p).map((o) => rel(o.file)).join(", ");
      out.push({ file: p.file, ...make(p, others) });
    }
  }
  return out;
};

export const scan = (ctx, { strict = false } = {}) => {
  const problems = [];
  const posts = [];
  const add = (file, list) => problems.push(...list.map((p) => ({ file, ...p })));
  const rel = (p) => path.relative(ctx.root, p).split(path.sep).join("/");
  const CONTENTS = ctx.contentsDir;

  if (!fs.existsSync(CONTENTS)) {
    add(CONTENTS, [error("contents 디렉터리가 없음")]);
    return { problems, posts };
  }
  for (const entry of listDir(CONTENTS)) {
    if (entry.name.startsWith(".")) continue;
    if (!entry.isDirectory() || !CATEGORIES.includes(entry.name)) {
      add(path.join(CONTENTS, entry.name), [warn(`contents/ 에는 ${CATEGORIES.join(", ")} 디렉터리만 읽힘`)]);
    }
  }

  for (const category of CATEGORIES) {
    const categoryDir = path.join(CONTENTS, category);
    if (!fs.existsSync(categoryDir)) continue;

    for (const entry of listDir(categoryDir)) {
      // 점 파일(.DS_Store 등)은 로더(src/lib/posts.ts)도 건너뛴다.
      if (entry.name.startsWith(".")) continue;
      const entryPath = path.join(categoryDir, entry.name);
      if (!entry.isDirectory()) {
        add(entryPath, [error(`contents/${category}/ 바로 아래에는 날짜 폴더만 둘 수 있음 (파일이 있으면 모든 페이지가 ENOTDIR 로 깨짐). 형식: contents/${category}/YYYY-MM-DD/<slug>.mdx`)]);
        continue;
      }
      if (!isRealDate(entry.name)) {
        add(entryPath, [error(`폴더 이름 "${entry.name}" 이 올바른 YYYY-MM-DD 날짜가 아님`)]);
      }

      const children = listDir(entryPath).filter((c) => !c.name.startsWith("."));
      const mdx = children.filter((c) => c.isFile() && c.name.endsWith(".mdx"));
      for (const c of children) {
        if (c.isFile() && c.name.endsWith(".mdx")) continue;
        add(path.join(entryPath, c.name), [warn(c.isDirectory() ? "날짜 폴더 안의 하위 폴더는 읽히지 않음" : "날짜 폴더 안의 .mdx 가 아닌 파일은 무시됨")]);
      }
      if (mdx.length === 0) {
        add(entryPath, [error("날짜 폴더에 .mdx 파일이 없음 (EISDIR 로 모든 페이지가 깨짐)")]);
        continue;
      }
      if (mdx.length > 1) {
        for (const c of mdx) {
          add(path.join(entryPath, c.name), [error(`날짜 폴더 하나에는 .mdx 가 정확히 1개여야 함 (현재 ${mdx.length}개 → 로더가 파일명을 이어 붙여 ENOENT 로 모든 페이지가 깨짐). 같은 날 두 번째 글은 다른 날짜 폴더에 두세요`)]);
        }
      }
      for (const c of mdx) {
        const file = path.join(entryPath, c.name);
        const result = checkPost(file, category, entry.name, ctx, { strict });
        add(file, result.problems);
        if (result.post) posts.push(result.post);
      }
    }
  }

  // slug 중복 (카테고리와 무관하게: 조회수 키가 slug 하나다)
  problems.push(...duplicates(posts, (p) => p.slug, (p, others) => error(`slug "${p.slug}" 이 중복됨 (${others})`), rel));
  // description 복붙 의심
  problems.push(...duplicates(posts, (p) => p.description, (p, others) => warn(`description 이 다른 글과 같음 (${others})`), rel));

  return { problems, posts };
};
