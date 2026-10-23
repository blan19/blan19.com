import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

// 표를 가로 스크롤 영역으로 감싼다: div.table-wrap > div.table-scroll[role=region] > table.
const rehypeTables = () => (tree: Root) => {
  visit(tree, "element", (node, index, parent) => {
    if (node.tagName !== "table" || !parent || index === undefined) return;
    const wrap: Element = {
      type: "element",
      tagName: "div",
      properties: { className: ["table-wrap"] },
      children: [
        {
          type: "element",
          tagName: "div",
          properties: {
            className: ["table-scroll"],
            role: "region",
            tabIndex: 0,
            ariaLabel: "표",
          },
          children: [node],
        },
      ],
    };
    parent.children[index] = wrap;
    return "skip";
  });
};

export default rehypeTables;
