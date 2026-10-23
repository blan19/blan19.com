import "server-only";

import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";

export type PostKind = "tech" | "log";

export interface PostMetadata {
  title: string;
  publishedAt: string;
  tags: string[];
  description: string;
  reference: string[];
}

export interface Post {
  slug: string;
  metadata: PostMetadata;
  content: string;
  // 폴더 순서(readdirSync, 현재 이름순) 기준 1부터
  index: number;
  readingMinutes: number;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;

// 펜스 코드는 줄 수(60줄/분), 나머지는 마크다운 기호와 공백을 뺀 글자 수(500자/분)로 추정한다.
export const readingMinutes = (content: string) => {
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

const readMDXFile = (filePath: string) => {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { metadata: data as PostMetadata, content };
};

const getMDXFiles = (dir: string) =>
  fs.readdirSync(dir).map(
    (folder) =>
      folder +
      "/" +
      fs
        .readdirSync(`${dir}/${folder}`)
        .filter((file) => path.extname(file) === ".mdx")
        .join(""),
  );

// 글 순서 = readdirSync 가 돌려주는 날짜 폴더 순서. 정렬 코드를 넣지 않는다.
export const getBlogPosts = (dir: PostKind): Post[] => {
  const root = path.join(process.cwd(), `contents/${dir}`);
  return getMDXFiles(root).map((file, i) => {
    const slug = path.basename(file, path.extname(file));
    const { metadata, content } = readMDXFile(root + "/" + file);
    return {
      slug,
      metadata,
      content,
      index: i + 1,
      readingMinutes: readingMinutes(content),
    };
  });
};

export const getPostsNewestFirst = (kind: PostKind): Post[] =>
  [...getBlogPosts(kind)].reverse();

export const getPost = cache(
  (kind: PostKind, slug: string): Post | undefined =>
    getBlogPosts(kind).find((post) => post.slug === slug),
);

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
  posts: Post[],
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
export const getTagCounts = (posts: Post[]): [tag: string, count: number][] => {
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
