import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

// 이미지 alt 메타 문법: `![설명 {768x432} {priority} {caption: 출처}](src)`.
// scripts/validate-content.mjs 의 checkImageMeta 가 같은 규칙을 검사한다.
const parseImageMeta = (meta: string) => {
  const size = meta.match(/\{(\d+)x(\d+)\}/);
  return {
    alt: meta.replace(/\s*\{[^}]*\}/g, "").trim(),
    width: size ? size[1] : "768",
    height: size ? size[2] : "432",
    priority: /{priority}/i.test(meta),
    caption: meta.match(/{caption: (.*?)}/)?.[1],
  };
};

// 루트 직계 문단 중 첫 자식이 img 인 것을 figure.img-fig 로 바꾼다(나머지 자식은 버린다).
// priority 는 글의 첫 번째 이미지에만 적용한다.
const rehypeImageFigures = () => (tree: Root) => {
  let firstImage: Element | undefined;
  visit(tree, "element", (node) => {
    if (node.tagName !== "img") return;
    firstImage = node;
    return false;
  });

  tree.children = tree.children.map((node) => {
    if (node.type !== "element" || node.tagName !== "p") return node;
    const image = node.children[0];
    if (!image || image.type !== "element" || image.tagName !== "img") {
      return node;
    }
    const meta = String(image.properties.alt ?? "");
    const { alt, width, height, priority, caption } = parseImageMeta(meta);
    const figure: Element = {
      type: "element",
      tagName: "figure",
      properties: {
        className: ["img-fig"],
        dataSrc: String(image.properties.src ?? ""),
        dataAlt: alt,
        dataWidth: width,
        dataHeight: height,
        ...(priority && image === firstImage ? { dataPriority: "" } : {}),
        ...(caption !== undefined ? { dataCaption: caption } : {}),
      },
      children: [],
    };
    return figure;
  });
};

export default rehypeImageFigures;
