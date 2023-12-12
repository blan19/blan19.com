"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

const increment = async (slug: string) => {
  noStore();

  await prisma.view.upsert({
    where: {
      slug,
    },
    update: {
      count: {
        increment: 1,
      },
    },
    create: {
      slug,
    },
  });
};

export { increment };
