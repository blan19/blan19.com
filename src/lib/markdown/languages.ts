// 코드 블록 언어의 단일 진실 원본. 콘텐츠 검사기(scripts/content/context.mjs)가 Node 타입 제거로 이 파일을 직접 import 한다.
// 지울 수 있는(erasable) TS 문법만 쓰고 import(@/ 별칭, 타입 import 포함)를 두지 않는다. CODE_LANGUAGES 를 바꾸면 shiki.ts 의 LANG_LOADERS 도 바꾼다(빠지면 tsc 가 잡는다).
export const CODE_LANGUAGES = [
  "bash",
  "css",
  "dart",
  "diff",
  "glsl",
  "html",
  "javascript",
  "json",
  "jsx",
  "rust",
  "tsx",
  "typescript",
  "yaml",
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const LANGUAGE_ALIASES: Record<string, CodeLanguage> = {
  "js": "javascript",
  "ts": "typescript",
  "sh": "bash",
  "shell": "bash",
  "zsh": "bash",
  "yml": "yaml",
};

export const PLAIN_LANGUAGES = [
  "text",
  "plaintext",
  "txt",
] as const;

export const DIAGRAM_LANGUAGES = [
  "mermaid",
] as const;

const isCodeLanguage = (lang: string): lang is CodeLanguage =>
  (CODE_LANGUAGES as readonly string[]).includes(lang);

export function normalizeLanguage(
  lang: string | undefined,
): { kind: "code"; lang: CodeLanguage } | { kind: "plain" } | { kind: "mermaid" } {
  const name = lang?.trim().toLowerCase() ?? "";
  if (!name) return { kind: "plain" };
  const alias = Object.hasOwn(LANGUAGE_ALIASES, name)
    ? LANGUAGE_ALIASES[name]
    : undefined;
  if (alias) return { kind: "code", lang: alias };
  if (isCodeLanguage(name)) return { kind: "code", lang: name };
  if ((DIAGRAM_LANGUAGES as readonly string[]).includes(name)) {
    return { kind: "mermaid" };
  }
  return { kind: "plain" };
}
