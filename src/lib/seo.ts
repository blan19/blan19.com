import type { Metadata } from "next";
import { getModifiedAt, type Post } from "@/lib/posts";
import config from "@/lib/config";

const FEED_TYPES = {
  "application/rss+xml": [{ url: "/rss.xml", title: "RSS" }],
  "application/atom+xml": [{ url: "/rss-atom.xml", title: "RSS Atom" }],
};

// 메타데이터는 세그먼트끼리 얕게 병합되어 페이지의 alternates 가 layout 의 것을 통째로 덮는다.
// 그래서 canonical 을 넣는 페이지도 RSS 링크를 함께 넣는다. path 는 metadataBase 기준 경로다.
export const alternates = (path?: string): Metadata["alternates"] => ({
  ...(path !== undefined && { canonical: path }),
  types: FEED_TYPES,
});

// /og 가 그리는 크기(src/app/og/route.tsx)와 같다.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

// og:image, twitter:image(openGraph 에서 상속), JSON-LD image 가 모두 이 URL 을 쓴다.
// /og 는 tech 글 제목이나 사이트 이름만 그대로 그리고, 그 밖의 title 은 사이트 이름으로 그린다.
export const ogImageUrl = (title: string = config.site.name) =>
  `${config.url}og?title=${encodeURIComponent(title)}`;

interface OpenGraphInput {
  title: string;
  description?: string;
  // metadataBase 기준 경로. 없으면 og:url 을 넣지 않는다(layout 기본값).
  path?: string;
  // OG 이미지에 그릴 제목. 글 페이지만 글 제목을 넘기고, 나머지는 사이트 이름이다.
  imageTitle?: string;
}

// openGraph 도 얕게 병합되어 페이지 값이 layout 의 것을 통째로 덮는다. 그래서 공통 필드(siteName, locale, 이미지)를
// 이 함수로 매번 채운다. twitter 는 layout 의 card 만 두고, 제목·설명·이미지는 Next 가 openGraph 에서 채운다.
export const openGraph = ({
  title,
  description,
  path,
  imageTitle = config.site.name,
}: OpenGraphInput) =>
  ({
    siteName: config.site.name,
    locale: "ko_KR",
    type: "website",
    title,
    ...(description !== undefined && { description }),
    ...(path !== undefined && { url: path }),
    images: [{ url: ogImageUrl(imageTitle), ...OG_IMAGE_SIZE, alt: imageTitle }],
  }) satisfies Metadata["openGraph"];

const PERSON_ID = `${config.url}#person`;
const WEBSITE_ID = `${config.url}#website`;

const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: config.site.name,
  description: config.site.description,
  url: config.url,
  inLanguage: "ko",
  publisher: { "@id": PERSON_ID },
};

const personNode = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: config.author.name,
  description: config.author.description,
  url: config.url,
  sameAs: [config.author.link],
};

export const siteJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [websiteNode, personNode],
});

// 글 하나를 한 문서(@graph)로: BlogPosting + WebPage + BreadcrumbList + WebSite + Person.
// @id 참조(#article, #breadcrumb, #website, #person)가 같은 문서 안에서 해석된다.
export const postJsonLd = (post: Post) => {
  const { slug, metadata } = post;
  const url = `${config.url}tech/${slug}`;
  const breadcrumbId = `${url}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: metadata.title,
        description: metadata.description,
        datePublished: metadata.publishedAt,
        dateModified: getModifiedAt(post),
        url,
        mainEntityOfPage: { "@id": url },
        image: {
          "@type": "ImageObject",
          url: ogImageUrl(metadata.title),
          ...OG_IMAGE_SIZE,
        },
        inLanguage: "ko",
        keywords: metadata.tags.join(", "),
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
        ...(metadata.reference.length > 0 && { citation: metadata.reference }),
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: metadata.title,
        inLanguage: "ko",
        isPartOf: { "@id": WEBSITE_ID },
        breadcrumb: { "@id": breadcrumbId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: config.url },
          { "@type": "ListItem", position: 2, name: "글", item: `${config.url}tech` },
          { "@type": "ListItem", position: 3, name: metadata.title, item: url },
        ],
      },
      websiteNode,
      personNode,
    ],
  };
};
