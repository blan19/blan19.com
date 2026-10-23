import type { Root } from "hast";

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface RenderedPost {
  hast: Root;
  toc: TocItem[];
}

// 콜아웃 타입의 원본. remark-alerts 의 마커 정규식, ui/post-body, 라벨(CALLOUT_LABELS)과 ui/callout 아이콘이 이 목록을 따른다.
// scripts/content/body.mjs 의 CALLOUT_TYPES 도 같이 바꾼다.
export const CALLOUT_TYPES = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
] as const;

export type CalloutType = (typeof CALLOUT_TYPES)[number];

// 콜아웃 머리 라벨(ui/callout, 피드 HTML 이 같이 쓴다).
export const CALLOUT_LABELS: Record<CalloutType, string> = {
  note: "참고",
  tip: "팁",
  important: "중요",
  warning: "주의",
  caution: "경고",
};

export const isCalloutType = (value: unknown): value is CalloutType =>
  (CALLOUT_TYPES as readonly unknown[]).includes(value);
