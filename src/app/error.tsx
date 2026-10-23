"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="site-wrap">
      <div className="site-col">
        <p className="kicker">error</p>
        <h1 className="page-title mt-3">문제가 생겼어요</h1>
        <p className="page-lede">잠시 후 다시 시도해 주세요.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-outline" onClick={() => retry()}>
            다시 시도
          </button>
          <Link href="/" className="btn-outline">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
