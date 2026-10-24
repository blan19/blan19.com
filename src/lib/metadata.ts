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

// canonical 에는 쿼리를 넣지 않는다(/tech?tag=… 도 /tech 로 모은다).
export const alternates = (path?: string): Metadata["alternates"] => ({
  ...(path && { canonical: path }),
  types: FEED_TYPES,
});

// og:image 는 넣지 않는다. 각 세그먼트의 opengraph-image 파일(/, /tech, /log 는 사이트 카드, 글은 글 카드)이 채운다.
// images 키가 있으면(undefined 라도) Next 가 그 세그먼트의 파일 이미지를 쓰지 않으므로 키 자체를 넣지 않는다.
export const openGraph = (path: string, title: string, description: string) => ({
  type: "website" as const,
  siteName: site.title,
  locale: "ko_KR",
  url: path,
  title,
  description,
});
