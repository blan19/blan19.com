import { buildFeed } from "@/lib/feed";

export async function GET() {
  return new Response((await buildFeed()).atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
