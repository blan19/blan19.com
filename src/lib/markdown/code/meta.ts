// 코드 펜스 meta: ```ts title="파일명" {4-6} showLineNumbers
// 따옴표 값 안의 글자는 옵션으로 읽지 않는다(title="showLineNumbers.ts", title="v{1}.ts" 가 옵션이 되지 않게).

export interface CodeMeta {
  // 빈 title="" 은 없는 것으로 본다(빈 파일명·aria-label 방지).
  title?: string;
  showLineNumbers: boolean;
  // Shiki transformer(transformerMetaHighlight 의 {n})에 넘길 meta. 따옴표 값은 지웠다.
  shikiMeta: string;
}

// subtitle= 같은 다른 키는 잡지 않는다.
const TITLE = /(?:^|\s)title="([^"]*)"/;
const QUOTED = /"[^"]*"/g;

export const parseCodeMeta = (raw: string): CodeMeta => {
  const rest = raw.replace(QUOTED, "\"\"");
  return {
    title: TITLE.exec(raw)?.[1]?.trim() || undefined,
    showLineNumbers: /\bshowLineNumbers\b/.test(rest),
    shikiMeta: rest,
  };
};
