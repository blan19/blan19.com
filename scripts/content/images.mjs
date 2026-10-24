// 본문 이미지(![alt](src)) 검사. ctx: { remotePatterns, remoteError, publicDir }.
import fs from "node:fs";
import path from "node:path";
import { importTs } from "../lib/import-ts.mjs";
import { error, warn } from "./problem.mjs";

// alt 메타 해석은 렌더러(rehype-image-figures)와 같은 parseImageMeta 를 쓴다.
const { parseImageMeta } = await importTs("src/lib/markdown/image-meta.ts");

// ![alt](url "title") / ![alt](<url with space>)
export const IMAGE_RE = /!\[([^\]]*)\]\(\s*(?:<([^>\n]*)>|([^)\s]+))(?:\s+"[^"]*")?\s*\)/g;
export const IMAGE_REF_RE = /!\[[^\]]*\]\[[^\]]*\]/;
const META_TOKEN_RE = /\{[^}]*\}/g;

const globToRegExp = (glob, sep) => {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const single = sep === "." ? "[^.]+" : "[^/]+";
  return new RegExp(`^${escaped.replace(/\*\*/g, "\u0000").replace(/\*/g, single).replace(/\u0000/g, ".*")}$`);
};

// next.config.js images.remotePatterns 와 같은 규칙으로 허용 여부를 본다(next/dist/shared/lib/match-remote-pattern.js):
// 프로토콜, 호스트 glob(`*` 한 단계, `**` 여러 단계), 포트, 경로 glob(`*` 한 세그먼트, `**` 여러 세그먼트),
// search(지정하면 쿼리 문자열이 정확히 같아야 한다. "" 면 쿼리가 없어야 한다). 생략한 항목은 모두 허용.
export const isAllowedRemote = (url, patterns) =>
  patterns.some((p) => {
    if (p.protocol && `${p.protocol}:` !== url.protocol) return false;
    if (!globToRegExp(p.hostname, ".").test(url.hostname)) return false;
    if (p.port && p.port !== url.port) return false;
    if (p.pathname && !globToRegExp(p.pathname, "/").test(url.pathname)) return false;
    if (p.search !== undefined && p.search !== url.search) return false;
    return true;
  });

// 오류 메시지용: "github.com/blan19/**" 처럼 호스트와 경로(와 search 제한)를 함께 보여 준다.
export const describePattern = (p) =>
  `${p.hostname}${p.pathname ?? ""}${p.search === "" ? " (쿼리 없음)" : p.search ? ` (${p.search})` : ""}`;

export const checkImageMeta = (lineNo, alt) => {
  const where = `${lineNo}행 이미지`;
  const out = [];
  if ((alt.match(/\{/g) ?? []).length !== (alt.match(/\}/g) ?? []).length) {
    return [error(`${where}: alt 의 중괄호 { } 짝이 맞지 않음 ("${alt}")`)];
  }
  if (/\{[^}]*\{/.test(alt)) {
    return [error(`${where}: alt 메타 안에 중괄호가 중첩됨. 렌더러가 alt 와 caption 을 잘못 자른다 ("${alt}")`)];
  }
  for (const token of alt.match(META_TOKEN_RE) ?? []) {
    const ok = /^\{priority\}$/i.test(token) || /^\{caption: .+\}$/.test(token) || /^\{\d+x\d+\}$/.test(token);
    if (ok) continue;
    if (/^\{caption/i.test(token)) out.push(warn(`${where}: 캡션 형식이 틀려 빈 캡션이 렌더됨 ${token} (형식: {caption: 텍스트}, 소문자, 콜론 뒤 공백 하나)`));
    else out.push(warn(`${where}: 알 수 없는 alt 메타 ${token} (허용: {priority}, {caption: 설명}, {768x432}. 그 외 토큰은 무시됨)`));
  }
  // 렌더러가 읽는 값: alt 에서 {…} 토큰을 지운 설명, 첫 {<숫자>x<숫자>} 토큰의 크기.
  const meta = parseImageMeta(alt);
  if (meta.alt === "") {
    out.push(error(`${where}: alt 설명 텍스트가 없음 (예: ![설명 {768x432}](...))`));
  }
  // 크기 토큰 개수는 렌더러가 쓰지 않는 검사기 전용 정보다.
  const sizes = alt.match(/\{\d+x\d+\}/g) ?? [];
  if (meta.width === 0 || meta.height === 0) out.push(error(`${where}: 크기 ${sizes[0]} 에 0 이 있음 → next/image 에 width/height 0 이 넘어감`));
  if (sizes.length > 1) out.push(warn(`${where}: 크기 토큰이 ${sizes.length}개임. 렌더러는 첫 ${sizes[0]} 만 쓴다`));
  return out;
};

export const checkImageSrc = (lineNo, src, ctx) => {
  const where = `${lineNo}행 이미지`;
  if (/^https?:\/\//.test(src)) {
    let url;
    try {
      url = new URL(src);
    } catch {
      return [error(`${where}: 잘못된 URL "${src}"`)];
    }
    if (ctx.remoteError) {
      return [error(`${where}: ${url.protocol}//${url.hostname} 허용 여부를 확인하지 못함 (next.config.js 를 읽지 못함: ${ctx.remoteError})`)];
    }
    if (!isAllowedRemote(url, ctx.remotePatterns)) {
      const allowed = ctx.remotePatterns.map(describePattern).join(", ");
      return [error(`${where}: ${url.protocol}//${url.host}${url.pathname}${url.search} 는 next.config.js images.remotePatterns 에 맞지 않음 (허용: ${allowed})`)];
    }
    return [];
  }
  if (src.startsWith("/")) {
    const local = path.join(ctx.publicDir, decodeURIComponent(src.split(/[?#]/)[0]));
    return fs.existsSync(local) ? [] : [error(`${where}: public${src} 파일이 없음`)];
  }
  return [error(`${where}: 이미지 경로 "${src}" 는 https URL 이거나 public 기준 절대경로(/image/...) 여야 함`)];
};
