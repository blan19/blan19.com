import { cache } from "react";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { increment } from "@/lib/db/action";
import { getViewCount } from "@/lib/db/queries";
import { getViewMap } from "@/lib/views";

// DB 를 읽는 표시 컴포넌트. 모두 <Suspense> 안에서만 쓴다.
// connection() 은 try 밖(prerender 중단 신호를 삼키지 않게), 쿼리만 try/catch 하고 실패하면 null.

const incrementView = cache(increment);

interface ViewsProps {
  slug: string;
}

const formatViews = (count: number) => `${count.toLocaleString("ko-KR")}회`;

const ArticleViews = async ({ slug }: ViewsProps) => {
  await connection();

  let count: number;
  try {
    const view = await getViewCount(slug);
    // 알려진 이슈: await 없이 호출한다(기존 동작 유지).
    incrementView(slug);
    count = view?.count ?? 0;
  } catch (error) {
    unstable_rethrow(error);
    console.error("[views] 조회수를 불러오지 못했습니다", error);
    return null;
  }

  return (
    <>
      <span className="meta-sep" aria-hidden="true" />
      <span className="views tnum">{formatViews(count)}</span>
    </>
  );
};

const RowViews = async ({ slug }: ViewsProps) => {
  await connection();

  let map: Map<string, number> | null;
  try {
    map = await getViewMap();
  } catch (error) {
    unstable_rethrow(error);
    // 로그는 getViewMap 이 요청당 한 번 남긴다.
    return null;
  }

  if (!map) return null;

  return <span className="views tnum">{formatViews(map.get(slug) ?? 0)}</span>;
};

const ViewsPending = () => (
  <>
    <span className="meta-sep" aria-hidden="true" />
    <span className="views is-loading" aria-busy="true">
      <span className="v-num">—</span>회
    </span>
  </>
);

export { RowViews, ViewsPending };
export default ArticleViews;
