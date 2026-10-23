import "server-only";
import type { Element, ElementContent, Properties, Root } from "hast";
import { toHtml } from "hast-util-to-html";
import { toString } from "hast-util-to-string";
import {
  decodeCallout,
  decodeCodeFigure,
  decodeDiagramFigure,
  decodeImageFigure,
} from "@/lib/markdown/figures";
import { el, hasClass, isElement } from "@/lib/markdown/hast-utils";
import { CALLOUT_LABELS } from "@/lib/markdown/types";

// RSS/Atom 항목 본문(content)용 HTML. renderMarkdown 의 HAST(모듈 캐시에 있는 공유 트리)는 고치지 않고 새 트리를 만든다.
// 피드 리더는 사이트 CSS 와 클라이언트 컴포넌트가 없으므로 figure 약속(figures.ts)을 평범한 HTML 로 푼다:
// 코드 → pre > code.language-x(Shiki 토큰, gutter 없이 글자만), 이미지 → figure > img + figcaption,
// mermaid → 원문 pre, 콜아웃 → blockquote(라벨 먼저). 제목 앵커와 표 스크롤 래퍼는 뺀다.
// 속성은 KEEP 만 남긴다(class, style, data-*, id, aria-* 는 버린다). URL 은 글 주소 기준 절대 URL 로 바꾼다
// (본문 안 #각주 링크는 글 페이지의 같은 id 로 간다).

const KEEP = [
  "href",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "align",
  "start",
  "type",
  "checked",
  "disabled",
  "colSpan",
  "rowSpan",
];

const text = (value: string) => ({ type: "text" as const, value });

const absolute = (url: string, base: string) => {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
};

const keepProps = (node: Element, base: string): Properties => {
  const props: Properties = {};
  for (const key of KEEP) {
    const value = node.properties[key];
    if (value === undefined || value === null) continue;
    // rehype-safe-urls 가 비운 URL("")은 속성째 뺀다.
    if ((key === "href" || key === "src") && value === "") continue;
    props[key] =
      (key === "href" || key === "src") && typeof value === "string"
        ? absolute(value, base)
        : value;
  }
  return props;
};

const codeBlock = (lang: string, source: string, caption?: string): Element => {
  const pre = el("pre", {}, [
    el("code", { className: [`language-${lang}`] }, [text(source)]),
  ]);
  return caption ? el("figure", {}, [el("figcaption", {}, [text(caption)]), pre]) : pre;
};

// Shiki 줄(span.line)의 글자만 이어 붙인다(gutter 는 빈 span). diff 블록은 줄 상태를 +/- 로 남긴다.
const codeSource = (pre: Element, diff: boolean) => {
  const code = pre.children.find((child) => isElement(child, "code")) ?? pre;
  if (code.type !== "element") return toString(code);
  return code.children
    .map((child) => {
      if (!isElement(child) || !hasClass(child, "line")) return toString(child);
      if (!diff) return toString(child);
      const mark = hasClass(child, "line-add") ? "+ " : hasClass(child, "line-del") ? "- " : "  ";
      return mark + toString(child);
    })
    .join("");
};

// ui/post-image 와 같이 URL 캡션은 "출처: 호스트" 링크로 쓴다.
const imageCaption = (caption: string): Element => {
  if (!/^https?:\/\//i.test(caption)) return el("figcaption", {}, [text(caption)]);
  let host = caption;
  try {
    host = new URL(caption).hostname.replace(/^www\./, "");
  } catch {}
  return el("figcaption", {}, [el("a", { href: caption }, [text(`출처: ${host}`)])]);
};

const figure = (node: Element, base: string): ElementContent[] | undefined => {
  const code = decodeCodeFigure(node);
  if (code) {
    const pre = node.children.find((child) => isElement(child, "pre"));
    const source = pre?.type === "element" ? codeSource(pre, code.diff) : "";
    return [codeBlock(code.lang, source, code.title)];
  }
  const image = decodeImageFigure(node);
  if (image) {
    const img = el("img", {
      src: absolute(image.src, base),
      alt: image.alt,
      width: image.width,
      height: image.height,
    });
    return [el("figure", {}, image.caption ? [img, imageCaption(image.caption)] : [img])];
  }
  const diagram = decodeDiagramFigure(node);
  if (diagram) return [codeBlock("mermaid", diagram.code, diagram.caption)];
  return undefined;
};

const transform = (node: ElementContent, base: string): ElementContent[] => {
  if (node.type === "comment") return [];
  if (node.type !== "element") return [node];

  if (node.tagName === "figure") {
    const replaced = figure(node, base);
    if (replaced) return replaced;
  }
  if (node.tagName === "aside") {
    const type = decodeCallout(node);
    if (type) {
      return [
        el("blockquote", {}, [
          el("p", {}, [el("strong", {}, [text(CALLOUT_LABELS[type])])]),
          ...transformAll(node.children, base),
        ]),
      ];
    }
  }
  // 제목 끝 `#` 앵커
  if (node.tagName === "a" && hasClass(node, "anchor")) return [];
  // div.table-wrap > div.table-scroll > table → table
  if (node.tagName === "div" && hasClass(node, "table-wrap")) {
    const scroll = node.children.find((child) => isElement(child, "div"));
    const table =
      scroll?.type === "element"
        ? scroll.children.find((child) => isElement(child, "table"))
        : undefined;
    if (table) return transform(table, base);
  }

  return [el(node.tagName, keepProps(node, base), transformAll(node.children, base))];
};

const transformAll = (nodes: ElementContent[], base: string) =>
  nodes.flatMap((node) => transform(node, base));

// postUrl: 글의 절대 URL(상대 URL 과 #링크의 기준).
export const toFeedHtml = (hast: Root, postUrl: string): string => {
  const children = hast.children.filter(
    (node): node is ElementContent => node.type !== "doctype",
  );
  const root: Root = { type: "root", children: transformAll(children, postUrl) };
  // feed 라이브러리(xml-js)는 CDATA 안의 "]]>" 를 첫 번째만 나눈다. HTML 에서 ">" 와 "&gt;" 는 같으므로 미리 바꾼다.
  return toHtml(root, { characterReferences: { useNamedReferences: true } }).replaceAll(
    "]]>",
    "]]&gt;",
  );
};
