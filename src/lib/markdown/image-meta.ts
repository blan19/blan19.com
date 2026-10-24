// 이미지 alt 메타 문법: `![설명 {768x432} {priority} {caption: 출처}](src)`.
// import 를 두지 않는다(타입 import 도 없음): 콘텐츠 검사기(scripts/content/images.mjs)가 Node 타입 제거로 바로 읽는다.

export const DEFAULT_IMAGE_SIZE = { width: 768, height: 432 };

export interface ImageMeta {
  alt: string;
  width: number;
  height: number;
  priority: boolean;
  caption?: string;
}

// alt 에서 {…} 토큰을 지운 나머지가 설명이고, 크기는 첫 {<숫자>x<숫자>} 토큰만 읽는다.
export function parseImageMeta(meta: string): ImageMeta {
  const size = meta.match(/\{(\d+)x(\d+)\}/);
  return {
    alt: meta.replace(/\s*\{[^}]*\}/g, "").trim(),
    width: size ? Number(size[1]) : DEFAULT_IMAGE_SIZE.width,
    height: size ? Number(size[2]) : DEFAULT_IMAGE_SIZE.height,
    priority: /{priority}/i.test(meta),
    caption: meta.match(/{caption: (.*?)}/)?.[1],
  };
}

// `{caption: https://…}` 는 출처 링크로 쓴다(ui/post-image, 피드 feed-html.ts 공용).
export const isUrlCaption = (caption: string) => /^https?:\/\//i.test(caption);

// "출처: <호스트>" 의 호스트(www. 제외). URL 이 아니면 그대로.
export const captionHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
