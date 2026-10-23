import type { Root } from "hast";
import { visit } from "unist-util-visit";

// URL 안전 처리. 이전 렌더러(react-markdown)의 defaultUrlTransform 규칙을 그대로 옮겼다(허용 프로토콜만 http, https, mailto 로 좁힘).
// 콜론이 없거나, 첫 콜론이 첫 `/`·`?`·`#` 보다 뒤면 상대 URL 로 보고 둔다. 그 밖에는 허용 프로토콜만 남기고 나머지(javascript: 등)는 빈 값.
const SAFE_PROTOCOL = /^(https?|mailto)$/i;

const isSafeUrl = (value: string) => {
  const colon = value.indexOf(":");
  const questionMark = value.indexOf("?");
  const numberSign = value.indexOf("#");
  const slash = value.indexOf("/");
  return (
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    SAFE_PROTOCOL.test(value.slice(0, colon))
  );
};

const sanitize = (value: unknown) =>
  typeof value === "string" && isSafeUrl(value) ? value : "";

// a[href], img[src] 만 본다. URL 속성을 새로 만드는 플러그인은 이 플러그인 앞에 두거나 여기에 그 속성을 더한다.
const rehypeSafeUrls = () => (tree: Root) => {
  visit(tree, "element", (node) => {
    if (node.tagName === "a" && node.properties.href !== undefined) {
      node.properties.href = sanitize(node.properties.href);
    }
    if (node.tagName === "img" && node.properties.src !== undefined) {
      node.properties.src = sanitize(node.properties.src);
    }
  });
};

export default rehypeSafeUrls;
