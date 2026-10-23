import type { ReactNode } from "react";
import CodeFold from "@/components/ui/code-fold";
import CopyButton from "@/components/ui/copy-button";
import Icon from "@/components/ui/icon";
import { normalizeLanguage } from "@/lib/markdown/languages";

interface CodeBlockProps {
  lang: string;
  title?: string;
  lines: number;
  lineNumbers: boolean;
  diff: boolean;
  prompt: boolean;
  collapsible: boolean;
  children: ReactNode;
}

const isTerminal = (lang: string) => {
  const language = normalizeLanguage(lang);
  return language.kind === "code" && language.lang === "bash";
};

const CodeBlock = ({
  lang,
  title,
  lines,
  lineNumbers,
  diff,
  prompt,
  collapsible,
  children,
}: CodeBlockProps) => {
  const terminal = isTerminal(lang);
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
        {title ? (
          <>
            <span className="code-file">
              <Icon name="file" />
              <span>{title}</span>
            </span>
            <span className="code-lang">
              {lang}
              {diff ? " · diff" : ""}
            </span>
          </>
        ) : (
          <span className="code-file">
            <Icon name={terminal ? "term" : "file"} />
            <span>{name}</span>
          </span>
        )}
        <CopyButton label={`${name} 코드 복사`} />
      </figcaption>
      <div className="code-body">
        <div
          className="code-scroll"
          tabIndex={0}
          role="region"
          aria-label={`${title ?? lang} 코드`}
        >
          {children}
        </div>
        {collapsible && <CodeFold lines={lines} />}
      </div>
    </figure>
  );
};

export default CodeBlock;
