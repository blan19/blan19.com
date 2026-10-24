import "server-only";

import { Feed } from "feed";
import { author, site } from "@/lib/config";
import { renderMarkdown } from "@/lib/markdown";
import { toFeedHtml } from "@/lib/markdown/feed-html";
import { getPostsNewestFirst } from "@/lib/posts";

// /rss.xml(RSS 2.0)과 /rss-atom.xml(Atom 1.0)이 같이 쓴다. 파일 읽기(동기), 글 날짜, 본문 렌더(계산뿐)만 쓰므로
// 두 GET 핸들러는 빌드 때 prerender 된다(Cache Components). new Date() 같은 현재 시각이나 fetch, 비동기 파일 읽기를
// 넣으면 요청 시점으로 바뀐다(빌드 출력의 ○ 가 ƒ 로 바뀐다).
// 항목 본문(content)은 글 페이지와 같은 HAST 를 리더용 HTML(feed-html.ts)로 바꾼 것이고, description 은 요약으로 둔다.
export const buildFeed = async (): Promise<Feed> => {
  const posts = getPostsNewestFirst("tech");
  const latest = posts[0];

  const feed = new Feed({
    title: site.title,
    description: site.description,
    id: site.url,
    link: site.url,
    language: site.locale,
    favicon: `${site.url}favicon.ico`,
    copyright: `All rights reserved since ${site.since}, ${author.name}`,
    // 빌드 시각이 아니라 가장 최근 글 날짜
    updated: latest ? new Date(latest.metadata.publishedAt) : undefined,
    // rel="self" 링크(feed 라이브러리 키는 rss, atom)
    feedLinks: {
      rss: `${site.url}rss.xml`,
      atom: `${site.url}rss-atom.xml`,
    },
    author,
  });

  const items = await Promise.all(
    posts.map(async (post) => {
      const link = `${site.url}tech/${post.slug}`;
      const { hast } = await renderMarkdown(post.slug, post.content);
      return { post, link, content: toFeedHtml(hast, link) };
    }),
  );

  for (const { post, link, content } of items) {
    feed.addItem({
      title: post.metadata.title,
      id: link,
      link,
      description: post.metadata.description,
      content,
      author: [author],
      contributor: [author],
      date: new Date(post.metadata.publishedAt),
      category: post.metadata.tags.map((name) => ({ name })),
    });
  }

  feed.addCategory("Technologies");

  return feed;
};
