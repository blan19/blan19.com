import { getBlogPosts } from "@/app/db/blog";

export default async function sitemap() {
  let blogs = getBlogPosts("tech").map((post) => ({
    url: `https://www.blan19.com/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let routes = ["", "/blog"].map((route) => ({
    url: `https://www.blan19.com${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs];
}
