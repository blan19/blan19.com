import { Feed } from "feed";
import { getBlogPosts } from "@/lib/posts";
import config from "@/lib/config";

export const dynamic = "force-static";

export async function GET() {
  const feed = new Feed({
    title: "blan19 기술 블로그",
    description: "프론트엔드 엔지니어 blan19의 블로그예요. 개발 글과 짧은 기록을 올려요.",
    id: config.url,
    link: config.url,
    language: "ko",
    favicon: `${config.url}favicon.ico`,
    copyright: "All rights reserved since 2023, blan19",
    generator: "generate-rss",
    author: config.author,
  });

  getBlogPosts("tech").forEach((post) =>
    feed.addItem({
      title: post.metadata.title,
      id: `${config.url}tech/${post.slug}`,
      link: `${config.url}tech/${post.slug}`,
      description: post.metadata.description,
      content: post.content,
      author: [config.author],
      contributor: [config.author],
      date: new Date(post.metadata.publishedAt),
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
