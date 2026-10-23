import type { Element, ElementContent, Root } from "hast";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import {
  HEADING_TAGS,
  isElement,
  isFootnoteSection,
} from "@/lib/markdown/hast-utils";

const PHRASING = new Set(["a", "strong", "em", "code", "del", "sup", "br", "span"]);
const SKIP_ANCESTORS = new Set(["aside", "blockquote", "table", "figure", ...HEADING_TAGS]);

const isWhitespace = (node: ElementContent) =>
  node.type === "text" && node.value.trim() === "";

const isPhrasing = (node: ElementContent): boolean => {
  if (node.type === "text") return true;
  if (node.type !== "element" || !PHRASING.has(node.tagName)) return false;
  return node.children.every(isPhrasing);
};

const isBackref = (node: ElementContent) =>
  node.type === "element" && node.properties.dataFootnoteBackref !== undefined;

// 복제한 내용에서 id 를 지우고(중복 id 방지) 링크를 탭 순서에서 뺀다(aria-hidden 안이라서).
const sanitizeClone = (nodes: ElementContent[]) => {
  for (const node of nodes) {
    if (node.type !== "element") continue;
    visit(node, "element", (child) => {
      delete child.properties.id;
      if (child.tagName === "a") child.properties.tabIndex = -1;
    });
  }
};

const trimTrailing = (nodes: ElementContent[]) => {
  while (nodes.length > 0) {
    const last = nodes[nodes.length - 1];
    if (last.type !== "text") break;
    last.value = last.value.replace(/\s+$/, "");
    if (last.value !== "") break;
    nodes.pop();
  }
};

// 각주 정의(li)를 사이드노트용 인라인 내용으로 바꾼다. 블록 콘텐츠가 있으면 undefined.
const inlineContent = (item: Element): ElementContent[] | undefined => {
  const blocks = item.children.filter((child) => !isWhitespace(child));
  if (blocks.length === 0 || !blocks.every((child) => isElement(child, "p"))) {
    return undefined;
  }
  const content: ElementContent[] = [];
  for (const paragraph of blocks as Element[]) {
    const children = structuredClone(
      paragraph.children.filter((child) => !isBackref(child)),
    );
    if (!children.every(isPhrasing)) return undefined;
    trimTrailing(children);
    if (children.length === 0) continue;
    if (content.length > 0) content.push({ type: "text", value: " " });
    content.push(...children);
  }
  if (content.length === 0) return undefined;
  sanitizeClone(content);
  return content;
};

interface Reference {
  sup: Element;
  link: Element;
  ancestors: Element[];
}

// 각주 참조와 조상 목록을 문서 순서로 모은다(각주 섹션 안은 제외).
const collectReferences = (root: Root) => {
  const references: Reference[] = [];
  const walk = (node: Element, ancestors: Element[]) => {
    if (isFootnoteSection(node)) return;
    if (node.tagName === "sup") {
      const link = node.children.find(
        (child): child is Element =>
          isElement(child, "a") && child.properties.dataFootnoteRef !== undefined,
      );
      if (link) {
        references.push({ sup: node, link, ancestors });
        return;
      }
    }
    for (const child of node.children) {
      if (child.type === "element") walk(child, [...ancestors, node]);
    }
  };
  for (const child of root.children) {
    if (child.type === "element") walk(child, []);
  }
  return references;
};

// 각주 정의를 첫 참조가 있는 문단(p 또는 li) 안에 span.sidenote 로 복제한다.
// ≥1280px 에서만 CSS float 로 오른쪽 여백에 보이고, 그 밖에서는 글 끝 각주 섹션이 정본이다.
const rehypeSidenotes = () => (tree: Root) => {
  const definitions = new Map<string, Element>();
  visit(tree, "element", (section) => {
    if (!isFootnoteSection(section)) return;
    visit(section, "element", (item) => {
      if (item.tagName === "li" && typeof item.properties.id === "string") {
        definitions.set(item.properties.id, item);
      }
    });
    return "skip";
  });

  const references = collectReferences(tree);
  const seen = new Set<string>();

  for (const { sup, link, ancestors } of references) {
    link.properties.className = ["fn-ref"];

    const href = typeof link.properties.href === "string" ? link.properties.href : "";
    const id = href.startsWith("#") ? href.slice(1) : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);

    if (ancestors.some((node) => SKIP_ANCESTORS.has(node.tagName))) continue;

    // 가장 가까운 블록 조상(인라인 요소가 아닌 조상)이 p 또는 li 여야 한다.
    let blockIndex = ancestors.length - 1;
    while (blockIndex >= 0 && PHRASING.has(ancestors[blockIndex].tagName)) {
      blockIndex -= 1;
    }
    const block = ancestors[blockIndex];
    if (!block || (block.tagName !== "p" && block.tagName !== "li")) continue;

    const definition = definitions.get(id);
    if (!definition) continue;
    const content = inlineContent(definition);
    if (!content) continue;

    const holder = ancestors[blockIndex + 1] ?? sup;
    const position = block.children.indexOf(holder);
    if (position === -1) continue;

    block.children.splice(position + 1, 0, {
      type: "element",
      tagName: "span",
      properties: { className: ["sidenote"], ariaHidden: "true" },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["sidenote-num"] },
          children: [{ type: "text", value: toString(link) }],
        },
        { type: "text", value: " " },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["sidenote-text"] },
          children: content,
        },
      ],
    });
  }
};

export default rehypeSidenotes;
