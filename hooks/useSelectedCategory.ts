import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";

export default function useSelectedCateogry() {
  const { query, push, pathname } = useRouter();
  const selectedCategry = useMemo(
    () =>
      typeof query.category !== "string" || !query.category
        ? "All"
        : query.category,
    [query]
  );

  const onPushQuery = useCallback(
    (query: string) => {
      push(pathname + query);
    },
    [pathname, push]
  );

  return { selectedCategry, onPushQuery };
}
