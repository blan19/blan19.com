import type { Metadata } from "next";
import { site } from "@/lib/config";

// layout 과 페이지가 같이 쓰는 메타데이터 조각. 경로는 metadataBase(site.url) 기준 절대 URL 로 풀린다.
// Next 는 openGraph, alternates 같은 중첩 필드를 세그먼트 사이에서 통째로 바꾼다(얕은 병합).
// 그래서 페이지가 이 필드를 정의할 때는 공통 값(RSS 링크, 사이트 이름, 로캘)을 여기서 다시 펼친다.

const FEED_TYPES = {
  "application/rss+xml": [{ url: "/rss.xml", title: "RSS" }],
  "application/atom+xml": [{ url: "/rss-atom.xml", title: "RSS Atom" }],
};

// OG 카드 크기(src/lib/og-image.tsx 가 그리는 크기).
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// app/opengraph-image.tsx(사이트 기본 카드). 파일 규칙의 이미지는 그 파일이 있는 세그먼트에만 붙고,
// 자기 openGraph 를 정의한 하위 페이지(/tech, /log)에서는 사라지므로 그 페이지들이 직접 넣는다.
const SITE_OG_IMAGE = { url: "/opengraph-image", ...OG_SIZE, type: OG_CONTENT_TYPE, alt: site.title };

// canonical 에는 쿼리를 넣지 않는다(/tech?tag=… 도 /tech 로 모은다).
export const alternates = (path?: string): Metadata["alternates"] => ({
  ...(path && { canonical: path }),
  types: FEED_TYPES,
});

// 기본은 사이트 카드(SITE_OG_IMAGE)를 넣는다. 자기 opengraph-image 가 있는 세그먼트(글)는 ownImage 로 뺀다.
// images 키가 있으면(undefined 라도) Next 가 그 세그먼트의 파일 이미지를 쓰지 않으므로 키 자체를 넣지 않는다.
export const openGraph = (
  path: string,
  title: string,
  description: string,
  { ownImage = false }: { ownImage?: boolean } = {},
) => ({
  type: "website" as const,
  siteName: site.name,
  locale: "ko_KR",
  url: path,
  title,
  description,
  ...(!ownImage && { images: [SITE_OG_IMAGE] }),
});
