import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getViewMap, recordView } from "@/lib/views";
import { formatViews } from "@/lib/format";

// DB 를 읽거나(RowViews) 조회수를 기록하는(ArticleViews) 표시 컴포넌트. 모두 <Suspense> 안에서만 쓴다.
// connection() 은 try 밖(prerender 중단 신호를 삼키지 않게), 쿼리만 try/catch 하고 실패하면 null.

interface ViewsProps {
  slug: string;
}

// 조회수를 올리고(await, 서버리스에서 응답 뒤 유실되지 않게) 올린 값을 보여 준다.
const ArticleViews = async ({ slug }: ViewsProps) => {
  await connection();

  let count: number | null;
  try {
    count = await recordView(slug);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[views] 조회수를 기록하지 못했습니다", error);
    return null;
  }

  if (count === null) return null;

  return <span className="views tnum">{formatViews(count)}</span>;
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
  <span className="views is-loading" aria-busy="true">
    <span className="v-num">—</span>회
  </span>
);

export { RowViews, ViewsPending };
export default ArticleViews;
