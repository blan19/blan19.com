import type { Root } from "hast";
import { SKIP, visit } from "unist-util-visit";
import { isFootnoteSection } from "@/lib/markdown/hast-utils";

const ANCHOR_HEADINGS = ["h2", "h3", "h4"];

// 헤딩 끝에 마우스용 링크 앵커 `#` 를 넣는다. aria-hidden + tabIndex -1 이라 헤딩의 접근 가능한 이름을
// 바꾸지 않는다(키보드와 스크린리더는 목차 링크로 같은 id 에 간다).
const rehypeHeadingAnchors = () => (tree: Root) => {
  visit(tree, "element", (node) => {
    if (isFootnoteSection(node)) return SKIP;
    if (!ANCHOR_HEADINGS.includes(node.tagName)) return;
    const id = node.properties.id;
    if (typeof id !== "string" || id === "") return SKIP;
    node.children.push({
      type: "element",
      tagName: "a",
      properties: {
        className: ["anchor"],
        href: `#${id}`,
        ariaHidden: "true",
        tabIndex: -1,
      },
      children: [{ type: "text", value: "#" }],
    });
    return SKIP;
  });
};

export default rehypeHeadingAnchors;
