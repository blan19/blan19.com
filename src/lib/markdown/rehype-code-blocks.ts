import type { Element, Parents, Properties, Root } from "hast";
import type { ShikiTransformer } from "shiki/core";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { classList, hasClass, isElement } from "@/lib/markdown/hast-utils";
import { normalizeLanguage } from "@/lib/markdown/languages";
import { getHighlighter } from "@/lib/markdown/shiki";

interface HighlightResult {
  pre: Element;
  lines: number;
  diff: boolean;
}

const CACHE_LIMIT = 500;
const TREE_LINE = /^\s*[├└│┌]/m;
const highlightCache = new Map<string, HighlightResult>();

// 줄 앞 gutter(span, CSS 생성 콘텐츠로 줄 번호/diff 기호/$ 표시)와 줄 상태 클래스.
// 반드시 마지막 transformer 이고 line() 이 아니라 code() 훅에서 고친다: line() 에서 줄 앞에 span 을 넣으면
// 뒤이은 표기 주석 처리가 토큰을 찾다가 터진다.
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
      if (text === "") this.addClassToHast(line, "empty");
      if (
        prompt &&
        text !== "" &&
        !text.trimStart().startsWith("#") &&
        !continued
      ) {
        this.addClassToHast(line, "prompt");
      }
      continued = /\\$/.test(text);
      line.children.unshift({
        type: "element",
        tagName: "span",
        properties: { className: ["gutter"], ariaHidden: "true" },
        children: [],
      });
    }
  },
  pre(node) {
    delete node.properties.style;
    delete node.properties.tabindex;
    delete node.properties.tabIndex;
  },
});

const highlight = async (
  source: string,
  lang: string,
  meta: string,
  prompt: boolean,
): Promise<HighlightResult> => {
  const cacheKey = JSON.stringify([lang, meta, source]);
  const cached = highlightCache.get(cacheKey);
  if (cached) return structuredClone(cached);

  const highlighter = await getHighlighter();
  const root = highlighter.codeToHast(source, {
    lang,
    theme: "blan19",
    meta: { __raw: meta },
    transformers: [
      transformerNotationDiff({
        classLineAdd: "line-add",
        classLineRemove: "line-del",
        classActivePre: "has-diff",
      }),
      transformerNotationHighlight({
        classActiveLine: "line-hl",
        classActivePre: "has-hl",
      }),
      transformerMetaHighlight({ className: "line-hl" }),
      transformerGutter(prompt),
    ],
  });

  const pre = root.children.find((node): node is Element =>
    isElement(node, "pre"),
  );
  if (!pre) throw new Error("shiki 가 pre 를 만들지 않았습니다");

  const lineNodes: Element[] = [];
  visit(pre, "element", (node) => {
    if (node.tagName === "span" && hasClass(node, "line")) {
      lineNodes.push(node);
      return "skip";
    }
  });
  const result: HighlightResult = {
    pre,
    lines: lineNodes.length,
    diff: hasClass(pre, "has-diff"),
  };

  if (highlightCache.size >= CACHE_LIMIT) {
    const oldest = highlightCache.keys().next().value;
    if (oldest !== undefined) highlightCache.delete(oldest);
  }
  highlightCache.set(cacheKey, structuredClone(result));
  return result;
};

const languageLabel = (code: Element) => {
  const name = classList(code)
    .find((name) => name.startsWith("language-"))
    ?.slice("language-".length);
  return name?.trim().toLowerCase() || undefined;
};

const metaOf = (code: Element) => {
  const meta = (code.data as { meta?: unknown } | undefined)?.meta;
  return typeof meta === "string" ? meta : "";
};

// pre > code 를 figure.code-block(Shiki 하이라이트) 또는 figure.diagram(mermaid)으로 바꾼다.
const rehypeCodeBlocks = () => async (tree: Root) => {
  const targets: { pre: Element; code: Element; parent: Parents }[] =
    [];
  visit(tree, "element", (node, _index, parent) => {
    if (node.tagName !== "pre" || !parent) return;
    const code = node.children.find((child): child is Element =>
      isElement(child, "code"),
    );
    if (!code) return;
    targets.push({ pre: node, code, parent });
    return "skip";
  });

  for (const { pre, code, parent } of targets) {
    const rawLang = languageLabel(code);
    const language = normalizeLanguage(rawLang);
    const meta = metaOf(code);
    const source = toString(code).replace(/\n$/, "");
    // 빈 title="" 은 없는 것으로 본다(빈 파일명·aria-label 방지).
    const title = /title="([^"]*)"/.exec(meta)?.[1]?.trim() || undefined;

    let replacement: Element;
    if (language.kind === "mermaid") {
      replacement = {
        type: "element",
        tagName: "figure",
        properties: {
          className: ["diagram"],
          dataMermaid: source,
          ...(title !== undefined ? { dataCaption: title } : {}),
        },
        children: [],
      };
    } else {
      const lang = language.kind === "code" ? language.lang : "text";
      // 디렉터리 트리(├── …)처럼 명령이 아닌 bash 블록에는 `$` 를 붙이지 않는다.
      const prompt =
        language.kind === "code" &&
        language.lang === "bash" &&
        !TREE_LINE.test(source);
      // 하이라이트 실패(문법·정규식 엔진 오류 등)가 글 전체를 error.tsx 로 보내지 않게, 그 블록만 text 로 다시 그린다.
      let result: HighlightResult;
      try {
        result = await highlight(source, lang, meta, prompt);
      } catch (error) {
        console.error(`[markdown] ${lang} 코드 블록 하이라이트 실패, text 로 렌더합니다`, error);
        result = await highlight(source, "text", meta, false);
      }
      const lineNumbers = result.lines >= 12 || /\bshowLineNumbers\b/.test(meta);
      const properties: Properties = {
        className: ["code-block"],
        dataLang: language.kind === "plain" ? "text" : (rawLang ?? "text"),
        dataLines: result.lines,
      };
      if (title !== undefined) properties.dataTitle = title;
      if (lineNumbers) properties.dataLn = "";
      if (result.diff) properties.dataDiff = "";
      if (prompt && !lineNumbers && !result.diff) properties.dataPrompt = "";
      if (result.lines > 30) properties.dataCollapsible = "";
      replacement = {
        type: "element",
        tagName: "figure",
        properties,
        children: [result.pre],
      };
    }

    const index = parent.children.indexOf(pre);
    if (index !== -1) parent.children[index] = replacement;
  }
};

export default rehypeCodeBlocks;
