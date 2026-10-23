import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { isElement, isFootnoteSection } from "@/lib/markdown/hast-utils";

// remark-rehype 가 만든 각주 섹션에 글 끝 섹션 클래스와 항목 수를 붙인다.
const rehypeFootnoteSection = () => (tree: Root) => {
  visit(tree, "element", (section) => {
    if (!isFootnoteSection(section)) return;
    section.properties.className = ["footnotes", "end-sec"];

    const list = section.children.find((child): child is Element =>
      isElement(child, "ol"),
    );
    const items = list
      ? list.children.filter((child) => isElement(child, "li")).length
      : 0;

    const label = section.children.find((child): child is Element =>
      isElement(child, "h2"),
    );
    label?.children.push({
      type: "element",
      tagName: "span",
      properties: { className: ["cnt"] },
      children: [{ type: "text", value: String(items) }],
    });

    visit(section, "element", (node) => {
      if (node.tagName === "a" && node.properties.dataFootnoteBackref !== undefined) {
        node.properties.className = ["fn-back"];
      }
    });
    return "skip";
  });
};

export default rehypeFootnoteSection;
