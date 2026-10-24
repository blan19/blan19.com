import { getPostsNewestFirst } from "@/lib/posts";
import { site } from "@/lib/config";

// llms.txt 형식(https://llmstxt.org): 제목, 한 줄 소개, 링크 목록. tech 글만 최신순으로 싣는다(sitemap 에는 넣지 않는다).
// 런타임 값을 읽지 않으므로 빌드 때 정적으로 만들어진다.
export async function GET() {
  const posts = getPostsNewestFirst("tech").map(
    ({ slug, metadata }) =>
      `- [${metadata.title}](${site.url}tech/${slug}): ${metadata.description}`,
  );

  const body = [
    `# ${site.title}`,
    "",
    `> ${site.description}`,
    "",
    "## 글",
    "",
    ...posts,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
