import type { Element, Parents, Root } from "hast";
import type { VFile } from "vfile";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { highlightCode, loadHighlighter } from "@/lib/markdown/code/highlight";
import { parseCodeMeta } from "@/lib/markdown/code/meta";
import { encodeCodeFigure, encodeDiagramFigure } from "@/lib/markdown/figures";
import { classList, isElement } from "@/lib/markdown/hast-utils";
import { normalizeLanguage } from "@/lib/markdown/languages";

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
const rehypeCodeBlocks = () => async (tree: Root, file: VFile) => {
  const targets: { pre: Element; code: Element; parent: Parents }[] = [];
  visit(tree, "element", (node, _index, parent) => {
    if (node.tagName !== "pre" || !parent) return;
    const code = node.children.find((child): child is Element =>
      isElement(child, "code"),
    );
    if (!code) return;
    targets.push({ pre: node, code, parent });
    return "skip";
  });

  // Shiki 는 글당 한 번만 기다린다(실패해도 블록마다 다시 시도하지 않는다). mermaid 만 있는 글은 기다리지 않는다.
  let highlighter: ReturnType<typeof loadHighlighter> | undefined;

  for (const { pre, code, parent } of targets) {
    const rawLang = languageLabel(code);
    const language = normalizeLanguage(rawLang);
    const meta = parseCodeMeta(metaOf(code));
    const source = toString(code).replace(/\n$/, "");

    let replacement: Element;
    if (language.kind === "mermaid") {
      replacement = encodeDiagramFigure({ code: source, caption: meta.title });
    } else {
      const lang = language.kind === "code" ? language.lang : "text";
      highlighter ??= loadHighlighter();
      const result = highlightCode(await highlighter, source, lang, meta.shikiMeta);
      if (result.degraded) file.data.highlightDegraded = true;
      const lineNumbers = result.lines >= 12 || meta.showLineNumbers;
      replacement = encodeCodeFigure(
        {
          lang: language.kind === "plain" ? "text" : (rawLang ?? "text"),
          title: meta.title,
          lines: result.lines,
          lineNumbers,
          diff: result.diff,
          prompt: result.prompt && !lineNumbers && !result.diff,
          collapsible: result.lines > 30,
          terminal: lang === "bash",
        },
        result.pre,
      );
    }

    const index = parent.children.indexOf(pre);
    if (index !== -1) parent.children[index] = replacement;
  }
};

export default rehypeCodeBlocks;
