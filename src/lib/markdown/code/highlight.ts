import "server-only";
import type { Element, ElementContent } from "hast";
import type { HighlighterCore } from "shiki/core";
import { visit } from "unist-util-visit";
import { codeTransformers, gutterSpan } from "@/lib/markdown/code/transformers";
import { el, hasClass, isElement } from "@/lib/markdown/hast-utils";
import type { CodeLanguage } from "@/lib/markdown/languages";
import { getHighlighter } from "@/lib/markdown/shiki";

export interface HighlightResult {
  pre: Element;
  lines: number;
  diff: boolean;
  // 실제로 `$` 줄 표시를 단 렌더인지(평문 대체 경로는 false).
  prompt: boolean;
  // Shiki 를 쓸 수 없어 평문으로 그렸다(일시적일 수 있으니 글 캐시에 두지 않는다).
  degraded: boolean;
}

// 디렉터리 트리(├── …)처럼 명령이 아닌 bash 블록에는 `$` 를 붙이지 않는다.
const TREE_LINE = /^\s*[├└│┌]/m;

const shikiHighlight = (
  highlighter: HighlighterCore,
  source: string,
  lang: CodeLanguage | "text",
  meta: string,
  prompt: boolean,
): HighlightResult => {
  const root = highlighter.codeToHast(source, {
    lang,
    theme: "blan19",
    meta: { __raw: meta },
    transformers: codeTransformers(prompt),
  });
  const pre = root.children.find((node): node is Element =>
    isElement(node, "pre"),
  );
  if (!pre) throw new Error("shiki 가 pre 를 만들지 않았습니다");

  let lines = 0;
  let diff = false;
  visit(pre, "element", (node) => {
    if (node.tagName !== "span" || !hasClass(node, "line")) return;
    lines += 1;
    if (hasClass(node, "line-add") || hasClass(node, "line-del")) diff = true;
    return "skip";
  });
  return { pre, lines, diff, prompt, degraded: false };
};

// Shiki 없이 만든 평문 pre. 구조(pre > code > span.line > span.gutter + 글자)는 Shiki 의 text 출력과 같아
// 줄 번호, 접힘, 복사 버튼이 그대로 동작한다. 글자는 텍스트 노드라 렌더할 때 이스케이프된다.
const plainHighlight = (source: string, degraded: boolean): HighlightResult => {
  const sourceLines = source.split("\n");
  const children: ElementContent[] = [];
  sourceLines.forEach((line, index) => {
    if (index > 0) children.push({ type: "text", value: "\n" });
    const value = line.replace(/[ \t]+$/, "");
    children.push(
      el("span", { className: ["line"] }, [
        gutterSpan(),
        ...(value === "" ? [] : [{ type: "text" as const, value }]),
      ]),
    );
  });
  return {
    pre: el("pre", {}, [el("code", {}, children)]),
    lines: sourceLines.length,
    diff: false,
    prompt: false,
    degraded,
  };
};

// 하이라이트가 실패해도(Shiki 초기화, 언어 문법, 정규식 엔진 오류) 그 블록만 평문으로 그린다.
// 글 전체가 error.tsx 로 가지 않는다.
export const highlightCode = async (
  source: string,
  lang: CodeLanguage | "text",
  meta: string,
): Promise<HighlightResult> => {
  let highlighter: HighlighterCore;
  try {
    highlighter = await getHighlighter();
  } catch (error) {
    console.error("[markdown] Shiki 를 불러오지 못해 코드 블록을 평문으로 렌더합니다", error);
    return plainHighlight(source, true);
  }
  const prompt = lang === "bash" && !TREE_LINE.test(source);
  try {
    return shikiHighlight(highlighter, source, lang, meta, prompt);
  } catch (error) {
    console.error(`[markdown] ${lang} 코드 블록 하이라이트 실패, 평문으로 렌더합니다`, error);
    return plainHighlight(source, false);
  }
};
