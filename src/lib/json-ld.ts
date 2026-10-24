import { author, site } from "@/lib/config";
import { OG_SIZE } from "@/lib/metadata";
import { getModifiedAt } from "@/lib/posts";
import type { Post } from "@/lib/posts";

// JSON-LD(schema.org). 홈은 WebSite + Person, 글은 한 문서(@graph)에 BlogPosting, WebPage, BreadcrumbList, WebSite, Person.
// @id 참조(#article, #breadcrumb, #website, #person)가 같은 문서 안에서 해석된다. 렌더는 ui/json-ld.

const PERSON_ID = `${site.url}#person`;
const WEBSITE_ID = `${site.url}#website`;

const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: site.title,
  description: site.description,
  url: site.url,
  inLanguage: site.locale,
  publisher: { "@id": PERSON_ID },
};

const personNode = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: author.name,
  description: author.description,
  url: site.url,
  sameAs: [author.link],
};

export const siteJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [websiteNode, personNode],
});

export const postJsonLd = (post: Post) => {
  const { slug, metadata } = post;
  const url = `${site.url}tech/${slug}`;
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
        // 같은 폴더의 opengraph-image.tsx 가 빌드 때 만든 글 카드
        image: {
          "@type": "ImageObject",
          url: `${url}/opengraph-image`,
          ...OG_SIZE,
        },
        inLanguage: site.locale,
        keywords: metadata.tags.join(", "),
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
        ...(metadata.reference.length > 0 && { citation: [...metadata.reference] }),
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: metadata.title,
        inLanguage: site.locale,
        isPartOf: { "@id": WEBSITE_ID },
        breadcrumb: { "@id": breadcrumbId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: site.url },
          { "@type": "ListItem", position: 2, name: "글", item: `${site.url}tech` },
          { "@type": "ListItem", position: 3, name: metadata.title, item: url },
        ],
      },
      websiteNode,
      personNode,
    ],
  };
};
