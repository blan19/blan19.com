import type { Root } from "hast";
import type { VFile } from "vfile";
import { SKIP, visit } from "unist-util-visit";
import { headingId, headingText, isFootnoteSection } from "@/lib/markdown/hast-utils";
import type { TocItem } from "@/lib/markdown/types";

// 목차는 렌더할 HAST 의 h2, h3 에서 id 를 그대로 읽는다(각주 섹션 제외). 그래서 앵커와 어긋날 수 없다.
// 글자에는 제목 안 각주 참조 번호를 넣지 않는다(id 는 rehype-slug 그대로라 번호가 남는다).
const rehypeCollectToc = () => (tree: Root, file: VFile) => {
  const toc: TocItem[] = [];
  visit(tree, "element", (node) => {
    if (isFootnoteSection(node)) return SKIP;
    if (node.tagName !== "h2" && node.tagName !== "h3") return;
    const id = headingId(node);
    if (id === undefined) return SKIP;
    toc.push({
      id,
      text: headingText(node).trim(),
      depth: node.tagName === "h2" ? 2 : 3,
    });
    return SKIP;
  });
  file.data.toc = toc;
};

export default rehypeCollectToc;
