"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <h1 className="font-medium text-2xl mb-2 tracking-tighter">
        에러가 발생했어요..!
      </h1>
      <p className="text-xs text-greyscale-6 dark:text-greyscale-3 mb-7">
        버튼을 클릭해 다시 시도해보세요
      </p>
      <button
        onClick={reset}
        className="py-2 px-3 bg-system-2 rounded text-greyscale-0 hover:bg-system-1"
      >
        리셋
      </button>
    </div>
  );
}
