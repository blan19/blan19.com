"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

interface CopyButtonProps {
  label: string;
}

const writeText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
};

// 삭제 줄(line-del)은 빼고 줄마다 꼬리 공백을 지운다. gutter 는 CSS 생성 콘텐츠라 텍스트에 없다.
const codeText = (figure: Element) =>
  Array.from(figure.querySelectorAll(".line:not(.line-del)"))
    .map((line) => (line.textContent ?? "").replace(/[ \t]+$/, ""))
    .join("\n");

const CopyButton = ({ label }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    const figure = event.currentTarget.closest("figure.code-block");
    if (!figure) return;
    const ok = await writeText(codeText(figure));
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      className="copy-btn"
      aria-label={label}
      data-copied={copied ? "" : undefined}
      onClick={handleClick}
    >
      <span aria-hidden="true">{copied ? "복사됨" : "복사"}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? "복사했습니다" : ""}
      </span>
    </button>
  );
};

export default CopyButton;
