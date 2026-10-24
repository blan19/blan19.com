import "server-only";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import prisma from "@/lib/prisma";
import { getPost } from "@/lib/posts";
import type { Post } from "@/lib/posts";

// 조회수(View 테이블) 읽기와 쓰기는 이 모듈만 한다. "use server" 가 아니라 Server Action 으로 노출되지 않는다.
// 부르는 컴포넌트는 <Suspense> 안에서 connection() 뒤에, 이 함수 호출만 try/catch 한다(ui/view-count, ui/most-read).
// connection() 이 prerender 를 거기서 멈추므로 next build 중에는 쿼리하지 않는다. 함수마다 한 번 더 불러 호출부가 빠뜨려도 막는다.

// POSTGRES_URL 이 비어 있으면 DB 를 건드리지 않는다(읽기, 쓰기 모두). 연결은 POSTGRES_PRISMA_URL 로 한다.
// scripts/with-blocked-db.mjs --preview 가 이 값만 비워 조회수 없이 글 화면을 띄운다.
const hasDatabase = () => Boolean(process.env.POSTGRES_URL);

// 글 머리 조회수: 있는 tech 글만 +1 하고 올린 뒤의 값을 돌려준다(왕복 1회, 이번 방문 포함).
// 요청당 한 번(React cache). DB 가 없거나 없는 글이면 null.
export const recordView = cache(
  async (slug: string): Promise<number | null> => {
    await connection();
    if (!hasDatabase() || !getPost("tech", slug)) return null;
    const { count } = await prisma.view.upsert({
      where: { slug },
      update: { count: { increment: 1 } },
      create: { slug, count: 1 },
      select: { count: true },
    });
    return count;
  },
);

// 목록 행 조회수(slug → count). 요청당 쿼리 1번(React cache). DB 가 없으면 null.
// 실패는 여기서 한 번만 로그를 남기고 다시 던진다
// (cache 라 같은 요청의 모든 RowViews 가 같은 rejected promise 를 받는다. 호출하는 쪽은 로그 없이 null).
export const getViewMap = cache(
  async (): Promise<Map<string, number> | null> => {
    await connection();
    if (!hasDatabase()) return null;
    try {
      const rows = await prisma.view.findMany({
        select: { slug: true, count: true },
      });
      return new Map(rows.map((row) => [row.slug, row.count]));
    } catch (error) {
      unstable_rethrow(error);
      console.error("[views] 조회수를 불러오지 못했습니다", error);
      throw error;
    }
  },
);

// 원격 캐시(Vercel 이 핸들러를 제공한다. 로컬 next start 는 메모리)에 1시간 두고 인스턴스끼리 나눠 쓴다.
// 기본 'use cache' 는 인스턴스 메모리라 서버리스에서는 요청마다 다시 조회하게 된다(use-cache-remote 문서). 배포마다 새로 채운다.
// 태그는 나중에 revalidateTag("views", ...) 로 비울 때 쓴다. 결과는 직렬화되므로 slug, count 만 고른다.
// 캐시 경계 밖으로 나가는 오류는 production 에서 메시지가 가려지므로 원래 오류를 여기서 로그하고 다시 던진다(오류는 캐시되지 않는다).
const getTopViews = async (
  take: number,
): Promise<{ slug: string; count: number }[]> => {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("views");
  try {
    return await prisma.view.findMany({
      select: { slug: true, count: true },
      orderBy: { count: "desc" },
      take,
    });
  } catch (error) {
    console.error("[most-read] 많이 읽힌 글을 불러오지 못했습니다", error);
    throw error;
  }
};

// 홈 "많이 읽힌 글". DB 에만 남은 slug(삭제/이름 변경된 글)는 빠지므로 n 개보다 적을 수 있다.
export const getMostRead = async (
  n: number,
): Promise<{ post: Post; count: number }[]> => {
  await connection();
  if (!hasDatabase()) return [];
  const rows = await getTopViews(n);
  return rows.flatMap(({ slug, count }) => {
    const post = getPost("tech", slug);
    return post ? [{ post, count }] : [];
  });
};
