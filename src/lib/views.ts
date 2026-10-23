import "server-only";

import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { getAllViewCounts } from "@/lib/db/queries";

// 요청당 쿼리 1번(React cache). 호출하는 쪽이 connection() 뒤, try/catch 안에서 부른다.
// POSTGRES_URL 이 없으면 null. 실패는 여기서 한 번만 로그를 남기고 다시 던진다
// (cache 라 같은 요청의 모든 RowViews 가 같은 rejected promise 를 받는다. 호출하는 쪽은 로그 없이 null).
export const getViewMap = cache(
  async (): Promise<Map<string, number> | null> => {
    try {
      const rows = await getAllViewCounts();
      if (!rows) return null;
      return new Map(rows.map((row) => [row.slug, row.count]));
    } catch (error) {
      unstable_rethrow(error);
      console.error("[views] 조회수를 불러오지 못했습니다", error);
      throw error;
    }
  },
);
