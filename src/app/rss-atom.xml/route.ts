import { Feed } from "feed";
import { getBlogPosts } from "../db/blog";
import config from "@/lib/config";

export async function GET() {
  const feed = new Feed({
    title: "Tech Blog by blan19",
    description: "Tech Blog by blan19",
    id: config.url,
    link: config.url,
    language: "ko",
    favicon: `${config.url}favicon.ico`,
    copyright: "All rights reserved since 2023, blan19",
    generator: "generate-rss",
    feedLinks: {
      json: `${config.url}json`,
      atom: `${config.url}atom`,
    },
    author: config.author,
  });

  getBlogPosts("tech").forEach((post) =>
    feed.addItem({
      title: post.metadata.title,
      id: post.slug,
      link: `${config.url}blog/${post.slug}`,
      description: post.metadata.description,
      content: post.content,
      author: [config.author],
      contributor: [config.author],
      date: new Date(post.metadata.publishedAt),
      image: `${config.url}og?title=${post.metadata.title}`,
      category: post.metadata.tags.map((tag) => ({ name: tag })) || [],
    })
  );

  feed.addCategory("Technologies");

  return new Response(feed.atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
