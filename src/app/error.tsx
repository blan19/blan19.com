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
      <div className="rail-grid page-head">
        <div className="rail-main">
          <p className="code-label">error</p>
          <h1 className="page-h1">문제가 생겼어요</h1>
          <p className="page-lede">잠시 후 다시 시도해 주세요.</p>
          <p className="link-row err-links">
            <button type="button" className="u-link" onClick={() => retry()}>
              다시 시도
            </button>
            <Link href="/" className="u-link">
              홈으로
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
