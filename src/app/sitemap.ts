import type { MetadataRoute } from "next";
import { getBlogPosts, getModifiedAt } from "@/lib/posts";
import config from "@/lib/config";

// "YYYY-MM-DD" 는 문자열 비교가 곧 날짜 비교다. 글이 없으면 lastmod 를 넣지 않는다.
const latest = (dates: string[]) =>
  dates.reduce<string | undefined>((max, d) => (!max || d > max ? d : max), undefined);

// 빌드 시각(new Date())이 아니라 글 날짜로 lastmod 를 정한다. DB 를 쓰지 않는 정적 라우트다.
export default function sitemap(): MetadataRoute.Sitemap {
  const tech = getBlogPosts("tech");
  const techModified = latest(tech.map(getModifiedAt));
  const logModified = latest(
    getBlogPosts("log").map((post) => post.metadata.publishedAt),
  );
  // 홈은 최신 tech 글과 최신 log 문단을 함께 보여 주므로 둘 중 늦은 날짜를 쓴다.
  const homeModified = latest(
    [techModified, logModified].filter((d): d is string => d !== undefined),
  );

  const routes = [
    { url: config.url, lastModified: homeModified },
    { url: `${config.url}tech`, lastModified: techModified },
    { url: `${config.url}log`, lastModified: logModified },
  ];

  const blogs = tech.map((post) => ({
    url: `${config.url}tech/${post.slug}`,
    lastModified: getModifiedAt(post),
  }));

  return [...routes, ...blogs];
}
