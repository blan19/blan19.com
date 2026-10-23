import type { MetadataRoute } from "next";
import { getBlogPosts, getLatestPublishedAt } from "@/lib/posts";
import { site } from "@/lib/config";

// lastModified 는 빌드 시각이 아니라 글 날짜다(정적 라우트, 배포마다 바뀌지 않게).
// 글은 publishedAt, 목록 페이지는 그 목록에서 가장 최근 글의 날짜(홈은 tech, log 둘 다 보여 준다).
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", lastModified: getLatestPublishedAt("tech", "log") },
    { path: "tech", lastModified: getLatestPublishedAt("tech") },
    { path: "log", lastModified: getLatestPublishedAt("log") },
  ].map(({ path, lastModified }) => ({ url: `${site.url}${path}`, lastModified }));

  const posts = getBlogPosts("tech").map((post) => ({
    url: `${site.url}tech/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  return [...routes, ...posts];
}
