import type { Heading, Root } from "mdast";
import { visit } from "unist-util-visit";

// 글은 `###` 를 섹션 제목으로 쓴다. h1 은 페이지 제목 하나뿐이므로 한 단계씩 내린다:
// `#`·`##`·`###` → h2, `####` → h3, `#####` → h4, `######` → h5.
const remarkShiftHeadings = () => (tree: Root) => {
  visit(tree, "heading", (node) => {
    node.depth = Math.max(2, node.depth - 1) as Heading["depth"];
  });
};

export default remarkShiftHeadings;
