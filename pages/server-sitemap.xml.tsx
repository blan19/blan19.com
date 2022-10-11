import { GetServerSideProps } from "next";
import { getServerSideSitemap, ISitemapField } from "next-sitemap";
import { getContentsPaths } from "../utils/markdown";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const posts = getContentsPaths("./contents/posts");
  const daily = getContentsPaths("./contents/daily");
  const lastmod = new Date().toISOString();

  const notDynamicPage: ISitemapField[] = [
    {
      loc: SITE_URL,
      changefreq: "daily",
      priority: 0.8,
      lastmod,
    },
    {
      loc: `${SITE_URL}/posts`,
      changefreq: "daily",
      priority: 0.9,
      lastmod,
    },
    {
      loc: `${SITE_URL}/daily`,
      changefreq: "daily",
      priority: 0.9,
      lastmod,
    },
  ];

  const postsPage: ISitemapField[] = posts.map((p) => ({
    loc: `${SITE_URL}/posts/${p.params.id}`,
    changefreq: "daily",
    priority: 1,
    lastmod,
  }));

  const dailyPage: ISitemapField[] = daily.map((d) => ({
    loc: `${SITE_URL}/posts/${d.params.id}`,
    changefreq: "daily",
    priority: 1,
    lastmod,
  }));

  const fields = [...notDynamicPage, ...postsPage, ...dailyPage];

  return getServerSideSitemap(ctx, fields);
};

export default function SitemapIndex() {}
