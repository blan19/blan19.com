import type { ReactNode } from "react";
import CodeFold from "@/components/ui/code-fold";
import CopyButton from "@/components/ui/copy-button";

interface CodeBlockProps {
  lang: string;
  title?: string;
  lines: number;
  lineNumbers: boolean;
  diff: boolean;
  prompt: boolean;
  collapsible: boolean;
  terminal: boolean;
  children: ReactNode;
}

// 헤더 한 줄 = figcaption(파일명/언어, figure 의 이름) + 복사 버튼. 버튼은 figure 이름에 섞이지 않게
// figcaption 밖 형제로 둔다(배치는 markdown.css 의 grid).
const CodeBlock = ({
  lang,
  title,
  lines,
  lineNumbers,
  diff,
  prompt,
  collapsible,
  terminal,
  children,
}: CodeBlockProps) => {
  const name = title ?? (terminal ? "터미널" : lang);
  return (
    <figure
      className="code-block"
      data-lang={lang}
      data-ln={lineNumbers ? "" : undefined}
      data-diff={diff ? "" : undefined}
      data-prompt={prompt ? "" : undefined}
      data-collapsible={collapsible ? "" : undefined}
      data-collapsed={collapsible ? "" : undefined}
    >
      <figcaption className="code-head">
        <span className="code-file">{name}</span>
        {title && (
          <>
            {" "}
            <span className="code-lang">
              {lang}
              {diff ? " · diff" : ""}
            </span>
          </>
        )}
      </figcaption>
      <CopyButton label={`${name} 코드 복사`} />
      <div className="code-body">
        <div
          className="code-scroll"
          tabIndex={0}
          role="region"
          aria-label={`${name} 코드`}
        >
          {children}
        </div>
        {collapsible && <CodeFold lines={lines} />}
      </div>
    </figure>
  );
};

export default CodeBlock;
