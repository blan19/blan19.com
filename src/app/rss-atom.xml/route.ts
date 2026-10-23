import { buildFeed } from "@/lib/feed";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildFeed().atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
