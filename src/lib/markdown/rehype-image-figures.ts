import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { encodeImageFigure } from "@/lib/markdown/figures";
import { isElement } from "@/lib/markdown/hast-utils";
import { parseImageMeta } from "@/lib/markdown/image-meta";

// 루트 직계 문단 중 첫 자식이 img 인 것을 figure.img-fig 로 바꾼다(나머지 자식은 버린다).
// alt 메타 문법은 image-meta.ts(scripts/content/images.mjs 의 checkImageMeta 도 같은 parseImageMeta 로 검사한다).
// priority 는 글의 첫 번째 이미지에만 적용한다.
const rehypeImageFigures = () => (tree: Root) => {
  let firstImage: Element | undefined;
  visit(tree, "element", (node) => {
    if (node.tagName !== "img") return;
    firstImage = node;
    return false;
  });

  tree.children = tree.children.map((node) => {
    if (!isElement(node, "p")) return node;
    const image = node.children[0];
    if (!isElement(image, "img")) return node;
    const { alt, width, height, priority, caption } = parseImageMeta(
      String(image.properties.alt ?? ""),
    );
    return encodeImageFigure({
      src: String(image.properties.src ?? ""),
      alt,
      width,
      height,
      priority: priority && image === firstImage,
      caption,
    });
  });
};

export default rehypeImageFigures;
