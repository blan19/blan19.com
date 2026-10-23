import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { isFootnoteSection } from "@/lib/markdown/hast-utils";

// remark-rehype 가 만든 각주 섹션에 글 끝 섹션 클래스를 붙이고, 본문의 각주 참조 링크와
// 섹션의 되돌아가기 링크에 클래스를 단다.
const rehypeFootnoteSection = () => (tree: Root) => {
  visit(tree, "element", (node) => {
    if (isFootnoteSection(node)) {
      node.properties.className = ["footnotes", "end-sec"];
      visit(node, "element", (child) => {
        if (child.tagName === "a" && child.properties.dataFootnoteBackref !== undefined) {
          child.properties.className = ["fn-back"];
        }
      });
      return "skip";
    }
    if (node.tagName === "a" && node.properties.dataFootnoteRef !== undefined) {
      node.properties.className = ["fn-ref"];
    }
  });
};

export default rehypeFootnoteSection;
