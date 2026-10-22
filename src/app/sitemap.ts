import { getBlogPosts } from "@/app/db/blog";
import config from "@/lib/config";

export default async function sitemap() {
  let blogs = getBlogPosts("tech").map((post) => ({
    url: `${config.url}tech/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let routes = ["", "tech", "log"].map((route) => ({
    url: `${config.url}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs];
}
