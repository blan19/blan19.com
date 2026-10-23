import type { ShikiTransformer } from "shiki/core";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { toString } from "hast-util-to-string";
import { el } from "@/lib/markdown/hast-utils";

// 줄 앞 gutter: CSS 생성 콘텐츠로 줄 번호/diff 기호/$ 를 그리는 빈 span(선택·복사에 들어가지 않는다).
export const gutterSpan = () =>
  el("span", { className: ["gutter"], ariaHidden: "true" });

// gutter 와 줄 상태 클래스(prompt). 반드시 마지막 transformer 이고 line() 이 아니라 code() 훅에서 고친다:
// line() 에서 줄 앞에 span 을 넣으면 뒤이은 표기 주석 처리가 토큰을 찾다가 터진다.
const transformerGutter = (prompt: boolean): ShikiTransformer => ({
  name: "blan19:gutter",
  code(node) {
    let continued = false;
    for (const line of node.children) {
      if (line.type !== "element") continue;
      // 표기 주석(`// [!code ++]`)이 지워지며 남긴 꼬리 공백을 지운다.
      for (let i = line.children.length - 1; i >= 0; i -= 1) {
        const token = line.children[i];
        const text =
          token.type === "text"
            ? token
            : token.type === "element"
              ? token.children[0]
              : undefined;
        if (!text || text.type !== "text") break;
        text.value = text.value.replace(/[ \t]+$/, "");
        if (text.value === "") {
          line.children.splice(i, 1);
          continue;
        }
        break;
      }
      const text = toString(line);
      if (
        prompt &&
        text !== "" &&
        !text.trimStart().startsWith("#") &&
        !continued
      ) {
        this.addClassToHast(line, "prompt");
      }
      continued = /\\$/.test(text);
      line.children.unshift(gutterSpan());
    }
  },
  // 인라인 style, tabindex, 쓰지 않는 클래스(shiki, 테마 이름)는 지운다. 색과 배경은 markdown.css 가 정한다.
  pre(node) {
    delete node.properties.class;
    delete node.properties.style;
    delete node.properties.tabindex;
    delete node.properties.tabIndex;
  },
});

// 순서 고정: 표기 주석(diff, highlight) → meta {n} → gutter(마지막).
// diff 여부는 줄 클래스(line-add/line-del)로 판단하므로 pre 에 has-* 클래스를 달지 않는다.
export const codeTransformers = (prompt: boolean): ShikiTransformer[] => [
  transformerNotationDiff({
    classLineAdd: "line-add",
    classLineRemove: "line-del",
    classActivePre: "",
  }),
  transformerNotationHighlight({
    classActiveLine: "line-hl",
    classActivePre: "",
  }),
  transformerMetaHighlight({ className: "line-hl" }),
  transformerGutter(prompt),
];
