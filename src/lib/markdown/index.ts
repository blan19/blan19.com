import "server-only";
import { createHash } from "node:crypto";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { VFile } from "vfile";
import rehypeCodeBlocks from "@/lib/markdown/rehype-code-blocks";
import rehypeCollectToc from "@/lib/markdown/rehype-collect-toc";
import rehypeFootnoteSection from "@/lib/markdown/rehype-footnote-section";
import rehypeHeadingAnchors from "@/lib/markdown/rehype-heading-anchors";
import rehypeImageFigures from "@/lib/markdown/rehype-image-figures";
import rehypeRawToText from "@/lib/markdown/rehype-raw-to-text";
import rehypeSafeUrls from "@/lib/markdown/rehype-safe-urls";
import rehypeTables from "@/lib/markdown/rehype-tables";
import remarkAlerts from "@/lib/markdown/remark-alerts";
import remarkShiftHeadings from "@/lib/markdown/remark-shift-headings";
import type { RenderedPost, TocItem } from "@/lib/markdown/types";

declare module "vfile" {
  interface DataMap {
    toc: TocItem[];
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkShiftHeadings)
  .use(remarkAlerts)
  .use(remarkRehype, {
    allowDangerousHtml: true,
    footnoteLabel: "각주",
    footnoteLabelTagName: "h2",
    footnoteLabelProperties: { className: ["end-label"] },
    footnoteBackLabel: "본문으로 돌아가기",
    footnoteBackContent: "↩",
  })
  .use(rehypeRawToText)
  .use(rehypeSafeUrls)
  .use(rehypeImageFigures)
  .use(rehypeCodeBlocks)
  .use(rehypeTables)
  .use(rehypeSlug)
  .use(rehypeCollectToc)
  .use(rehypeHeadingAnchors)
  .use(rehypeFootnoteSection)
  .freeze();

const CACHE_LIMIT = 50;
const cache = new Map<string, Promise<RenderedPost>>();

const render = async (markdown: string): Promise<RenderedPost> => {
  const file = new VFile(markdown);
  const hast = await processor.run(processor.parse(file), file);
  return {
    hast,
    toc: file.data.toc ?? [],
  };
};

// 글 본문을 HAST 로 한 번 만들어 모듈 캐시에 둔다. TOC 도 같은 트리에서 나온다.
// 키는 slug 와 본문 해시라 글이 바뀌면 새로 만든다.
export async function renderMarkdown(
  key: string,
  markdown: string,
): Promise<RenderedPost> {
  const hash = createHash("sha1").update(markdown).digest("hex");
  const cacheKey = `${key}:${hash}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const promise = render(markdown);
  cache.set(cacheKey, promise);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  promise.catch(() => {
    if (cache.get(cacheKey) === promise) cache.delete(cacheKey);
  });
  return promise;
}
