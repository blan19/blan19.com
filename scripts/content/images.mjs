// 본문 이미지(![alt](src)) 검사. ctx: { remotePatterns, remoteError, publicDir }.
import fs from "node:fs";
import path from "node:path";
import { error, warn } from "./problem.mjs";

// ![alt](url "title") / ![alt](<url with space>)
export const IMAGE_RE = /!\[([^\]]*)\]\(\s*(?:<([^>\n]*)>|([^)\s]+))(?:\s+"[^"]*")?\s*\)/g;
export const IMAGE_REF_RE = /!\[[^\]]*\]\[[^\]]*\]/;
const META_TOKEN_RE = /\{[^}]*\}/g;

const globToRegExp = (glob, sep) => {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const single = sep === "." ? "[^.]+" : "[^/]+";
  return new RegExp(`^${escaped.replace(/\*\*/g, "\u0000").replace(/\*/g, single).replace(/\u0000/g, ".*")}$`);
};

// next.config.js images.remotePatterns 와 같은 규칙(프로토콜, 호스트 glob, 포트, 경로 glob)으로 허용 여부를 본다.
export const isAllowedRemote = (url, patterns) =>
  patterns.some((p) => {
    if (p.protocol && `${p.protocol}:` !== url.protocol) return false;
    if (!globToRegExp(p.hostname, ".").test(url.hostname)) return false;
    if (p.port && p.port !== url.port) return false;
    if (p.pathname && !globToRegExp(p.pathname, "/").test(url.pathname)) return false;
    return true;
  });

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
  // 렌더러(src/lib/markdown/rehype-image-figures.ts)와 같은 정규식: alt 에서 {…} 토큰을 지우고, 크기는 첫 {<숫자>x<숫자>} 토큰만 읽는다.
  if (alt.replace(/\s*\{[^}]*\}/g, "").trim() === "") {
    out.push(error(`${where}: alt 설명 텍스트가 없음 (예: ![설명 {768x432}](...))`));
  }
  const sizes = alt.match(/\{\d+x\d+\}/g) ?? [];
  if (sizes[0] && /^\{0+x|x0+\}$/.test(sizes[0])) out.push(error(`${where}: 크기 ${sizes[0]} 에 0 이 있음 → next/image 에 width/height 0 이 넘어감`));
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
      const hosts = ctx.remotePatterns.map((p) => p.hostname).join(", ");
      return [error(`${where}: ${url.protocol}//${url.hostname} 는 next.config.js images.remotePatterns 에 없음 (허용: ${hosts})`)];
    }
    return [];
  }
  if (src.startsWith("/")) {
    const local = path.join(ctx.publicDir, decodeURIComponent(src.split(/[?#]/)[0]));
    return fs.existsSync(local) ? [] : [error(`${where}: public${src} 파일이 없음`)];
  }
  return [error(`${where}: 이미지 경로 "${src}" 는 https URL 이거나 public 기준 절대경로(/image/...) 여야 함`)];
};
