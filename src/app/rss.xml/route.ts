import { buildFeed } from "@/lib/feed";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildFeed().rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
