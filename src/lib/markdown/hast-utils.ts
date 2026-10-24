import type { Element, ElementContent, Nodes, Properties } from "hast";

// hast 는 클래스를 className(배열)에, shiki 는 class(문자열 또는 배열)에 둔다. 둘 다 읽는다.
export const classList = (node: Element): string[] => {
  const value = node.properties.className ?? node.properties.class;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean);
  return [];
};

export const hasClass = (node: Element, name: string) =>
  classList(node).includes(name);

export const isElement = (
  node: Nodes | undefined,
  tagName?: string,
): node is Element =>
  node?.type === "element" && (tagName === undefined || node.tagName === tagName);

export const el = (
  tagName: string,
  properties: Properties = {},
  children: ElementContent[] = [],
): Element => ({ type: "element", tagName, properties, children });

export const isFootnoteSection = (node: Element) =>
  node.tagName === "section" && node.properties.dataFootnotes !== undefined;

export const isFootnoteRef = (node: Element) =>
  node.tagName === "a" && node.properties.dataFootnoteRef !== undefined;

export const isFootnoteBackref = (node: Element) =>
  node.tagName === "a" && node.properties.dataFootnoteBackref !== undefined;

// rehype-slug 가 단 id. 없거나 비면 undefined.
export const headingId = (node: Element) => {
  const id = node.properties.id;
  return typeof id === "string" && id !== "" ? id : undefined;
};

// 제목 글자(hast-util-to-string 과 같다). 각주 참조(sup > a[data-footnote-ref])의 번호는 뺀다.
export const headingText = (node: Nodes): string => {
  if (node.type === "text") return node.value;
  if (node.type !== "element" && node.type !== "root") return "";
  if (
    isElement(node, "sup") &&
    node.children.some((child) => isElement(child) && isFootnoteRef(child))
  ) {
    return "";
  }
  return node.children.map(headingText).join("");
};
