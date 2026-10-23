import { getBlogPosts } from "@/lib/posts";
import { site } from "@/lib/config";

export default async function sitemap() {
  let blogs = getBlogPosts("tech").map((post) => ({
    url: `${site.url}tech/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let routes = ["", "tech", "log"].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs];
}
