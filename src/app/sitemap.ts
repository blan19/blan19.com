import type { MetadataRoute } from "next";
import { getBlogPosts, getLatestModifiedAt, getModifiedAt } from "@/lib/posts";
import { site } from "@/lib/config";

// lastModified 는 빌드 시각이 아니라 글 날짜다(정적 라우트, 배포마다 바뀌지 않게).
// 글은 수정일(updatedAt, 없으면 publishedAt), 목록 페이지는 그 목록에서 가장 늦은 수정일(홈은 tech, log 둘 다 보여 준다).
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", lastModified: getLatestModifiedAt("tech", "log") },
    { path: "tech", lastModified: getLatestModifiedAt("tech") },
    { path: "log", lastModified: getLatestModifiedAt("log") },
  ].map(({ path, lastModified }) => ({ url: `${site.url}${path}`, lastModified }));

  const posts = getBlogPosts("tech").map((post) => ({
    url: `${site.url}tech/${post.slug}`,
    lastModified: getModifiedAt(post),
  }));

  return [...routes, ...posts];
}
