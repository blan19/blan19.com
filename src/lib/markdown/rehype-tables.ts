import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { el } from "@/lib/markdown/hast-utils";

// 표를 가로 스크롤 영역으로 감싼다: div.table-wrap > div.table-scroll[role=region] > table.
const rehypeTables = () => (tree: Root) => {
  visit(tree, "element", (node, index, parent) => {
    if (node.tagName !== "table" || !parent || index === undefined) return;
    parent.children[index] = el("div", { className: ["table-wrap"] }, [
      el(
        "div",
        { className: ["table-scroll"], role: "region", tabIndex: 0, ariaLabel: "표" },
        [node],
      ),
    ]);
    return "skip";
  });
};

export default rehypeTables;
