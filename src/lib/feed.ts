import "server-only";

import { Feed } from "feed";
import { author, site } from "@/lib/config";
import { getPostsNewestFirst } from "@/lib/posts";

// /rss.xml(RSS 2.0)과 /rss-atom.xml(Atom 1.0)이 같이 쓴다. 파일 읽기(동기)와 글 날짜만 쓰므로
// 두 GET 핸들러는 빌드 때 prerender 된다(Cache Components). new Date() 같은 현재 시각을 넣으면 요청 시점으로 바뀐다.
// 항목 본문(content)은 넣지 않고 description 만 쓴다. 마크다운 원문은 리더에서 깨지고,
// 렌더된 HTML 은 커스텀 figure, Shiki 색(CSS 변수), 상대 URL 을 따로 바꿔야 한다.
export const buildFeed = (): Feed => {
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

  for (const post of posts) {
    const link = `${site.url}tech/${post.slug}`;
    feed.addItem({
      title: post.metadata.title,
      id: link,
      link,
      description: post.metadata.description,
      author: [author],
      contributor: [author],
      date: new Date(post.metadata.publishedAt),
      category: post.metadata.tags.map((name) => ({ name })),
    });
  }

  feed.addCategory("Technologies");

  return feed;
};
