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

// 콜아웃 타입의 원본. remark-alerts 의 마커 정규식, ui/post-body, ui/callout 라벨과 아이콘이 이 목록을 따른다.
// scripts/validate-content.mjs 의 CALLOUT_TYPES 도 같이 바꾼다.
export const CALLOUT_TYPES = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
] as const;

export type CalloutType = (typeof CALLOUT_TYPES)[number];

export const isCalloutType = (value: unknown): value is CalloutType =>
  (CALLOUT_TYPES as readonly unknown[]).includes(value);
