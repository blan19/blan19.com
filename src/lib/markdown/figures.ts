import type { Element, Properties } from "hast";
import { el, hasClass } from "@/lib/markdown/hast-utils";
import { DEFAULT_IMAGE_SIZE } from "@/lib/markdown/image-meta";
import { type CalloutType, isCalloutType } from "@/lib/markdown/types";

// 플러그인이 figure/aside 에 싣고 ui/post-body 가 컴포넌트 props 로 읽는 데이터의 약속.
// 마커 클래스, data-* 키, 기본값은 이 파일에만 둔다(encode 는 플러그인, decode 는 post-body).
// server-only 가 아니다(shiki 를 import 하지 않는다). 이 속성들은 컴포넌트로 바뀌므로 HTML 에 그대로 나가지 않는다.

export interface CodeFigure {
  lang: string;
  title?: string;
  lines: number;
  lineNumbers: boolean;
  diff: boolean;
  prompt: boolean;
  collapsible: boolean;
  terminal: boolean;
}

export interface ImageFigure {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority: boolean;
  caption?: string;
}

export interface DiagramFigure {
  code: string;
  caption?: string;
}

const CODE_CLASS = "code-block";
const IMAGE_CLASS = "img-fig";
const DIAGRAM_CLASS = "diagram";
const CALLOUT_CLASS = "callout";

const text = (node: Element, key: string) => {
  const value = node.properties[key];
  return value === undefined || value === null ? undefined : String(value);
};

const flag = (node: Element, key: string) => node.properties[key] !== undefined;

const flagProp = (on: boolean) => (on ? "" : undefined);

const count = (node: Element, key: string, fallback: number) => {
  const value = Number(node.properties[key]);
  return Number.isFinite(value) ? value : fallback;
};

export const encodeCodeFigure = (data: CodeFigure, pre: Element): Element =>
  el(
    "figure",
    {
      className: [CODE_CLASS],
      dataLang: data.lang,
      dataTitle: data.title,
      dataLines: data.lines,
      dataLn: flagProp(data.lineNumbers),
      dataDiff: flagProp(data.diff),
      dataPrompt: flagProp(data.prompt),
      dataCollapsible: flagProp(data.collapsible),
      dataTerminal: flagProp(data.terminal),
    },
    [pre],
  );

export const decodeCodeFigure = (node: Element): CodeFigure | undefined => {
  if (!hasClass(node, CODE_CLASS)) return undefined;
  return {
    lang: text(node, "dataLang") ?? "text",
    title: text(node, "dataTitle"),
    lines: count(node, "dataLines", 0),
    lineNumbers: flag(node, "dataLn"),
    diff: flag(node, "dataDiff"),
    prompt: flag(node, "dataPrompt"),
    collapsible: flag(node, "dataCollapsible"),
    terminal: flag(node, "dataTerminal"),
  };
};

export const encodeImageFigure = (data: ImageFigure): Element =>
  el("figure", {
    className: [IMAGE_CLASS],
    dataSrc: data.src,
    dataAlt: data.alt,
    dataWidth: data.width,
    dataHeight: data.height,
    dataPriority: flagProp(data.priority),
    dataCaption: data.caption,
  });

export const decodeImageFigure = (node: Element): ImageFigure | undefined => {
  if (!hasClass(node, IMAGE_CLASS)) return undefined;
  return {
    src: text(node, "dataSrc") ?? "",
    alt: text(node, "dataAlt") ?? "",
    width: count(node, "dataWidth", DEFAULT_IMAGE_SIZE.width),
    height: count(node, "dataHeight", DEFAULT_IMAGE_SIZE.height),
    priority: flag(node, "dataPriority"),
    caption: text(node, "dataCaption"),
  };
};

export const encodeDiagramFigure = (data: DiagramFigure): Element =>
  el("figure", {
    className: [DIAGRAM_CLASS],
    dataMermaid: data.code,
    dataCaption: data.caption,
  });

export const decodeDiagramFigure = (
  node: Element,
): DiagramFigure | undefined => {
  if (!hasClass(node, DIAGRAM_CLASS)) return undefined;
  return {
    code: text(node, "dataMermaid") ?? "",
    caption: text(node, "dataCaption"),
  };
};

// remark-alerts 가 mdast 의 hProperties 로 넘긴다(aside.callout).
export const encodeCallout = (type: CalloutType): Properties => ({
  className: [CALLOUT_CLASS],
  dataType: type,
});

// 알 수 없는 타입은 note 로 그린다.
export const decodeCallout = (node: Element): CalloutType | undefined => {
  if (!hasClass(node, CALLOUT_CLASS)) return undefined;
  const type = node.properties.dataType;
  return isCalloutType(type) ? type : "note";
};
