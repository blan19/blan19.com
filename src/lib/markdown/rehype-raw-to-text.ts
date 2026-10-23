import type { Root } from "hast";
import { visit } from "unist-util-visit";

// 본문의 raw HTML 은 렌더하지 않고 글자 그대로 보여 준다(이전 렌더러의 기본 동작과 같다).
const rehypeRawToText = () => (tree: Root) => {
  visit(tree, "raw", (node, index, parent) => {
    if (!parent || index === undefined) return;
    parent.children[index] = { type: "text", value: node.value };
  });
};

export default rehypeRawToText;
