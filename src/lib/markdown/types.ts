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

export type CalloutType = "note" | "tip" | "important" | "warning" | "caution";
