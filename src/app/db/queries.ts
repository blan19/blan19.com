"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

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

export { getViewCount };
