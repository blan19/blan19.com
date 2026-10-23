import type { Element, Nodes } from "hast";

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

export const isFootnoteSection = (node: Element) =>
  node.tagName === "section" && node.properties.dataFootnotes !== undefined;

export const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
