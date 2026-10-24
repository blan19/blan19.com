import type { Blockquote, Paragraph, PhrasingContent, Root } from "mdast";
import { visit } from "unist-util-visit";
import { encodeCallout } from "@/lib/markdown/figures";
import { CALLOUT_TYPES, isCalloutType } from "@/lib/markdown/types";

const MARKER = new RegExp(
  String.raw`^\[!(${CALLOUT_TYPES.join("|")})\][ \t]*(\r?\n|$)`,
  "i",
);

const isBlank = (node: PhrasingContent) =>
  node.type === "text" && node.value.trim() === "";

// 제목 승격: 첫 문단이 `**제목**` 으로 시작하고 그 뒤가 없거나 줄바꿈이면 제목 문단으로 떼어 낸다.
const promoteTitle = (node: Blockquote) => {
  const first = node.children[0];
  if (!first || first.type !== "paragraph") return;
  const start = first.children.findIndex((child) => !isBlank(child));
  if (start === -1) return;
  const strong = first.children[start];
  if (strong.type !== "strong") return;
  const rest = first.children.slice(start + 1);
  const next = rest[0];
  if (next) {
    if (next.type === "text") {
      if (!/^\r?\n/.test(next.value)) return;
      const value = next.value.replace(/^\r?\n/, "");
      if (value === "") rest.shift();
      else rest[0] = { ...next, value };
    } else if (next.type === "break") {
      rest.shift();
    } else {
      return;
    }
  }
  const title: Paragraph = {
    type: "paragraph",
    children: [strong],
    data: { hProperties: { className: ["callout-title"] } },
  };
  const blocks: Paragraph[] = [title];
  if (rest.length > 0) blocks.push({ ...first, children: rest });
  node.children.splice(0, 1, ...blocks);
};

// `> [!NOTE]` 같은 GitHub 알림 문법만 콜아웃(aside.callout)으로 바꾼다. 마커가 없는 인용은 그대로 둔다.
const remarkAlerts = () => (tree: Root) => {
  visit(tree, "blockquote", (node) => {
    const paragraph = node.children[0];
    if (!paragraph || paragraph.type !== "paragraph") return;
    const text = paragraph.children[0];
    if (!text || text.type !== "text") return;
    const match = MARKER.exec(text.value);
    if (!match) return;

    const type = match[1].toLowerCase();
    if (!isCalloutType(type)) return;
    text.value = text.value.slice(match[0].length);
    if (text.value === "") paragraph.children.shift();
    if (paragraph.children.length === 0) node.children.shift();

    promoteTitle(node);

    node.data = {
      ...node.data,
      hName: "aside",
      // role 은 ui/callout 이 단다.
      hProperties: encodeCallout(type),
    };
  });
};

export default remarkAlerts;
