import "server-only";

import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";

export type PostKind = "tech" | "log";

// 글 객체는 요청(dev)이나 프로세스(production) 사이에 공유된다. 고치지 말고 복사해서 쓴다.
export interface PostMetadata {
  readonly title: string;
  readonly publishedAt: string;
  readonly tags: readonly string[];
  readonly description: string;
  readonly reference: readonly string[];
}

export interface Post {
  readonly slug: string;
  readonly metadata: PostMetadata;
  readonly content: string;
  readonly readingMinutes: number;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;

// 펜스 코드는 줄 수(60줄/분), 나머지는 마크다운 기호와 공백을 뺀 글자 수(500자/분)로 추정한다.
const readingMinutes = (content: string) => {
  let codeLines = 0;
  let fence: string | null = null;
  const prose: string[] = [];

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(FENCE);
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length) {
        fence = null;
      } else {
        codeLines += 1;
      }
      continue;
    }
    if (match) {
      fence = match[1];
      continue;
    }
    prose.push(line);
  }

  const proseChars = prose
    .join("\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, "")
    .replace(/\s+/g, "").length;

  return Math.max(1, Math.ceil(proseChars / 500 + codeLines / 60));
};

// ---js frontmatter 는 gray-matter 가 eval 하므로 막는다(js 별칭도 javascript 엔진으로 간다).
// 옵션을 넘기면 gray-matter 의 원문 키 전역 캐시(같은 data 객체를 돌려줌)도 쓰지 않는다.
const MATTER_OPTIONS = {
  engines: {
    javascript: () => {
      throw new Error("JS frontmatter 는 쓸 수 없습니다(YAML 만)");
    },
  },
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

// scripts/validate-content.mjs 의 최소 부분. 어기면 파일 경로를 담아 던진다(빌드가 실패한다).
const parseMetadata = (file: string, data: Record<string, unknown>): PostMetadata => {
  const fail = (message: string): never => {
    throw new Error(`${file}: frontmatter ${message}`);
  };
  const { title, description, publishedAt, tags = [], reference = [] } = data;

  if (typeof title !== "string" || !title.trim()) fail("title 이 비어 있습니다");
  if (typeof description !== "string") fail("description 이 없습니다");
  if (publishedAt instanceof Date) {
    fail('publishedAt 을 따옴표로 감싸야 합니다(예: "2024-05-15")');
  }
  if (typeof publishedAt !== "string" || !DATE.test(publishedAt)) {
    fail(`publishedAt "${String(publishedAt)}" 이 YYYY-MM-DD 가 아닙니다`);
  }
  if (!isStringArray(tags)) fail("tags 는 문자열 배열이어야 합니다");
  if (!isStringArray(reference)) fail("reference 는 문자열 배열이어야 합니다");

  return Object.freeze({
    title: title as string,
    description: description as string,
    publishedAt: publishedAt as string,
    tags: Object.freeze([...(tags as string[])]),
    reference: Object.freeze([...(reference as string[])]),
  });
};

const readPost = (root: string, file: string): Post => {
  const filePath = path.join(root, file);
  const name = path.relative(process.cwd(), filePath);
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(fs.readFileSync(filePath, "utf-8"), MATTER_OPTIONS);
  } catch (error) {
    throw new Error(`${name}: ${(error as Error).message}`, { cause: error });
  }
  const { data, content } = parsed;
  return Object.freeze({
    slug: path.basename(file, ".mdx"),
    metadata: parseMetadata(name, data),
    content,
    readingMinutes: readingMinutes(content),
  });
};

// contents/<kind>/YYYY-MM-DD/<slug>.mdx 경로(root 기준) 목록. 점 파일(.DS_Store 등)은 건너뛴다.
// 글 순서 = 날짜 폴더 이름순(오래된 글 → 새 글). readdirSync 순서에 기대지 않고 직접 정렬한다.
const listPostFiles = (root: string): string[] =>
  fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .map((entry) => {
      const folder = path.join(root, entry.name);
      if (!entry.isDirectory() || !DATE.test(entry.name)) {
        throw new Error(`${path.relative(process.cwd(), folder)}: 날짜 폴더(YYYY-MM-DD)만 둘 수 있습니다`);
      }
      return entry.name;
    })
    .sort()
    .map((name) => {
      const mdx = fs
        .readdirSync(path.join(root, name))
        .filter((file) => !file.startsWith(".") && path.extname(file) === ".mdx");
      if (mdx.length !== 1) {
        const folder = path.relative(process.cwd(), path.join(root, name));
        throw new Error(`${folder}: .mdx 가 정확히 1개여야 합니다(현재 ${mdx.length}개)`);
      }
      return path.join(name, mdx[0]);
    });

interface PostIndex {
  list: readonly Post[];
  newestFirst: readonly Post[];
  bySlug: ReadonlyMap<string, Post>;
}

const readIndex = (kind: PostKind): PostIndex => {
  const root = path.join(process.cwd(), "contents", kind);
  const list = Object.freeze(listPostFiles(root).map((file) => readPost(root, file)));
  return {
    list,
    newestFirst: Object.freeze([...list].reverse()),
    bySlug: new Map(list.map((post) => [post.slug, post])),
  };
};

// 배포 뒤 contents/ 는 바뀌지 않으므로 production 은 종류별로 프로세스당 한 번 읽는다.
// dev 는 글 편집이 바로 보이도록 요청마다 한 번(React cache, 렌더 밖에서는 매번) 읽는다.
const memo = new Map<PostKind, PostIndex>();
const loadIndex: (kind: PostKind) => PostIndex =
  process.env.NODE_ENV === "production"
    ? (kind) => {
        let index = memo.get(kind);
        if (!index) {
          index = readIndex(kind);
          memo.set(kind, index);
        }
        return index;
      }
    : cache(readIndex);

// 오래된 글 → 새 글(날짜 폴더 이름순)
export const getBlogPosts = (kind: PostKind): readonly Post[] =>
  loadIndex(kind).list;

export const getPostsNewestFirst = (kind: PostKind): readonly Post[] =>
  loadIndex(kind).newestFirst;

export const getPost = (kind: PostKind, slug: string): Post | undefined =>
  loadIndex(kind).bySlug.get(slug);

// prev = 폴더 순서상 바로 이전(더 오래된 글), next = 바로 다음(더 새 글)
export const getAdjacentPosts = (
  kind: PostKind,
  slug: string,
): { prev?: Post; next?: Post } => {
  const posts = getBlogPosts(kind);
  const i = posts.findIndex((post) => post.slug === slug);
  if (i === -1) return {};
  return { prev: posts[i - 1], next: posts[i + 1] };
};

// 입력 순서를 유지한 채 publishedAt 앞 4자리로 묶는다.
export const groupByYear = (
  posts: readonly Post[],
): { year: string; posts: Post[] }[] => {
  const groups: { year: string; posts: Post[] }[] = [];
  for (const post of posts) {
    const year = post.metadata.publishedAt.slice(0, 4);
    const last = groups[groups.length - 1];
    const group = last?.year === year ? last : groups.find((g) => g.year === year);
    if (group) group.posts.push(post);
    else groups.push({ year, posts: [post] });
  }
  return groups;
};

// 개수 내림차순, 같으면 이름순
export const getTagCounts = (
  posts: readonly Post[],
): [tag: string, count: number][] => {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.metadata.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts).sort(
    ([a, an], [b, bn]) => bn - an || a.localeCompare(b),
  );
};

export const getLogParagraphs = (content: string): string[] =>
  content
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
