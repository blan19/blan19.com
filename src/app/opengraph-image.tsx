import { site } from "@/lib/config";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

// 사이트 기본 OG 이미지(/, /tech, /log 등 자기 이미지가 없는 페이지). 빌드 때 한 번 만든다.
export const alt = site.title;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage(site.title);
}
