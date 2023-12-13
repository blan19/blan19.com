"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { unstable_cache as cache } from "next/cache";

const getViewCount = async (slug: string) => {
  if (!process.env.POSTGRES_URL) {
    return null;
  }

  noStore();

  const view = await prisma.view.findUnique({
    where: {
      slug,
    },
  });

  return view;
};

const getBestBlogPosts = cache(
  async () => {
    const posts = await prisma.view.findMany({
      orderBy: {
        count: "asc",
      },
      take: 3,
    });

    return posts;
  },
  ["blan19-best-posts"],
  {
    revalidate: 3600,
  }
);

const getLatestBlogPosts = cache(
  async () => {
    const posts = await prisma.view.findMany({
      orderBy: {
        createAt: "asc",
      },
      take: 3,
    });

    return posts;
  },
  ["blan19-latest-posts"],
  {
    revalidate: 3600,
  }
);

export { getViewCount, getBestBlogPosts, getLatestBlogPosts };
