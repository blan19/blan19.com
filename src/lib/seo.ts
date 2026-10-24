import type { Metadata } from "next";
import type { Post } from "@/lib/posts";
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

const PERSON_ID = `${config.url}#person`;
const WEBSITE_ID = `${config.url}#website`;

const personRef = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: config.author.name,
  url: config.url,
};

export const siteJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: config.site.name,
      description: config.site.description,
      url: config.url,
      inLanguage: "ko",
      publisher: { "@id": PERSON_ID },
    },
    {
      ...personRef,
      sameAs: [config.author.link],
    },
  ],
});

// dateModified 는 넣지 않는다(frontmatter 에 수정일이 없다).
export const postJsonLd = ({ slug, metadata }: Post) => {
  const url = `${config.url}tech/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: metadata.title,
    description: metadata.description,
    datePublished: metadata.publishedAt,
    url,
    mainEntityOfPage: url,
    image: `${config.url}og?title=${encodeURIComponent(metadata.title)}`,
    inLanguage: "ko",
    keywords: metadata.tags,
    author: personRef,
    isPartOf: { "@id": WEBSITE_ID },
    ...(metadata.reference.length > 0 && { citation: metadata.reference }),
  };
};
