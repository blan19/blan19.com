"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Icon from "@/components/ui/icon";

const COPIED_MS = 1500;

const writeClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // 권한이 없거나 비보안 컨텍스트면 아래 방식으로 대신한다.
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    textarea.remove();
  }
};

const CopyLink = () => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    await writeClipboard(window.location.href);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <button
      type="button"
      className={clsx("copy-link", copied && "is-done")}
      onClick={onClick}
    >
      <Icon name={copied ? "check" : "link"} />
      <span aria-live="polite">{copied ? "복사됨" : "링크 복사"}</span>
    </button>
  );
};

export default CopyLink;
