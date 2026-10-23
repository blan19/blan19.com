import { buildFeed } from "@/lib/feed";

export async function GET() {
  return new Response((await buildFeed()).rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
