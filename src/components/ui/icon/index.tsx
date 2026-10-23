import clsx from "clsx";
import type { ReactNode } from "react";

export type IconName =
  | "note"
  | "tip"
  | "important"
  | "warning"
  | "caution"
  | "copy"
  | "check"
  | "sun"
  | "moon"
  | "system"
  | "chev"
  | "file"
  | "term"
  | "img-off"
  | "list"
  | "x";

interface IconProps {
  name: IconName;
  className?: string;
  title?: string;
}

// 24px viewBox, stroke 만 쓰는 아이콘(굵기와 끝 모양은 globals.css 의 .icon).
// 경로는 이전 MARGIN 시안의 <symbol> 에서 옮겼다(시안 파일은 저장소에 없다).
const paths: Record<IconName, ReactNode> = {
  note: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </>
  ),
  tip: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
    </>
  ),
  important: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z" />
      <path d="M12 7.5v4" />
      <path d="M12 14h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </>
  ),
  caution: (
    <>
      <path d="M8.2 2.8h7.6l5.4 5.4v7.6l-5.4 5.4H8.2l-5.4-5.4V8.2z" />
      <path d="M12 8v4.5" />
      <path d="M12 16h.01" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  system: (
    <>
      <rect x="3" y="4" width="18" height="12.5" rx="2" />
      <path d="M8.5 20h7M12 16.5V20" />
    </>
  ),
  chev: <path d="m6 9 6 6 6-6" />,
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  term: (
    <>
      <path d="m5 8 4 4-4 4" />
      <path d="M12 17h7" />
    </>
  ),
  "img-off": (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.5 5H19a2 2 0 0 1 2 2v8.5" />
      <path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2" />
      <path d="m3 16 4.5-4.5 3 3" />
      <path d="M14.5 14.5 16 13l5 5" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r=".8" fill="currentColor" />
      <circle cx="4.5" cy="12" r=".8" fill="currentColor" />
      <circle cx="4.5" cy="18" r=".8" fill="currentColor" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
};

const Icon = ({ name, className, title }: IconProps) => {
  return (
    <svg
      className={clsx("icon", className)}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
};

export default Icon;
