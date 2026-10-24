import "server-only";
import {
  createHighlighterCore,
  type HighlighterCore,
  type LanguageRegistration,
  type ThemeRegistration,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { CodeLanguage } from "@/lib/markdown/languages";

// 토큰 색은 CSS 변수(globals.css 의 --sh-*)라 라이트/다크 전환은 변수 교체만으로 된다.
// TextMate 는 더 구체적인 스코프가 이긴다. fontStyle 은 쓰지 않는다(한글 italic 금지).
export const blanTheme: ThemeRegistration = {
  name: "blan19",
  type: "light",
  colors: {
    "editor.foreground": "var(--sh-text)",
    "editor.background": "var(--code-bg)",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: "var(--sh-comment)" },
    },
    {
      scope: [
        "keyword",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
        "keyword.operator.typeof",
        "keyword.operator.instanceof",
        "variable.language",
        "entity.name.tag",
        "support.type.primitive",
      ],
      settings: { foreground: "var(--sh-keyword)" },
    },
    {
      scope: [
        "string",
        "string.quoted",
        "string.template",
        "punctuation.definition.string",
        "string.regexp",
      ],
      settings: { foreground: "var(--sh-string)" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function",
        "variable.function",
        "support.function.builtin.shell",
        "entity.name.command.shell",
      ],
      settings: { foreground: "var(--sh-fn)" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
        "support.class.component",
        "entity.other.inherited-class",
        "entity.name.type.module",
        "entity.name.namespace",
      ],
      settings: { foreground: "var(--sh-type)" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "constant.other",
        "support.constant",
      ],
      settings: { foreground: "var(--sh-number)" },
    },
    {
      scope: [
        "variable.other.property",
        "variable.other.object.property",
        "meta.object-literal.key",
        "support.type.property-name",
        "support.variable.property",
        "entity.other.attribute-name",
        "variable.parameter.shell",
      ],
      settings: { foreground: "var(--sh-prop)" },
    },
    {
      scope: [
        "punctuation",
        "meta.brace",
        "keyword.operator",
        "punctuation.definition.tag",
        "punctuation.separator",
        "punctuation.terminator",
        "punctuation.definition.template-expression",
      ],
      settings: { foreground: "var(--sh-punct)" },
    },
    {
      scope: [
        "variable",
        "variable.other.readwrite",
        "variable.parameter",
        "meta.jsx.children",
        "source",
      ],
      settings: { foreground: "var(--sh-text)" },
    },
    // ```diff 펜스: 무채색으로 구분한다(--diff-add = --text, --diff-del = --text-3, 코드 배경 대비 ≥ 4.6:1).
    // 표기(// [!code ++]) 방식은 줄 배경과 gutter 기호로 구분하므로 여기와 무관하다.
    {
      scope: ["markup.inserted", "punctuation.definition.inserted"],
      settings: { foreground: "var(--diff-add)" },
    },
    {
      scope: ["markup.deleted", "punctuation.definition.deleted"],
      settings: { foreground: "var(--diff-del)" },
    },
    {
      scope: ["meta.diff.range", "meta.diff.header", "meta.diff.index"],
      settings: { foreground: "var(--sh-fn)" },
    },
  ],
};

// 언어 모듈. 키는 languages.ts 의 CODE_LANGUAGES 와 같아야 한다(빠지거나 남으면 satisfies 로 tsc 가 잡는다).
// 키와 import 경로의 파일명을 같게 쓴다(경로가 틀린 것은 tsc 가 못 잡는다).
// 문자열 리터럴 import 로 하나씩 쓴다. 템플릿 문자열로 쓰면 번들러가 shiki/langs 전체를 묶는다.
const LANG_LOADERS = {
  bash: () => import("shiki/langs/bash.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  dart: () => import("shiki/langs/dart.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  glsl: () => import("shiki/langs/glsl.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
} satisfies Record<
  CodeLanguage,
  () => Promise<{ default: LanguageRegistration[] }>
>;

const createHighlighter = (): Promise<HighlighterCore> =>
  createHighlighterCore({
    themes: [blanTheme],
    langs: Object.values(LANG_LOADERS).map((load) => load()),
    engine: createJavaScriptRegexEngine(),
  });

let highlighterPromise: Promise<HighlighterCore> | undefined;

// 모듈 싱글턴. 실패하면 다음 호출에서 다시 만든다.
export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    const promise = createHighlighter();
    highlighterPromise = promise;
    promise.catch(() => {
      if (highlighterPromise === promise) highlighterPromise = undefined;
    });
  }
  return highlighterPromise;
}

// 모듈 import 시점에 시작해 둔다(prewarm).
void getHighlighter();
