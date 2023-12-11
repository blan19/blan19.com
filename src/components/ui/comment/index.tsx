"use client";

import { useEffect, useRef } from "react";

const repo = "blan19/blan19.com";

const Comment = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const utterances = document.createElement("script");
    const attributes = {
      src: "https://utteranc.es/client.js",
      repo,
      "issue-term": "pathname",
      label: "comment",
      theme: "preferred-color-scheme",
      crossorigin: "anonymous",
      async: "true",
    };
    Object.entries(attributes).forEach(([key, value]) => {
      utterances.setAttribute(key, value);
    });
    ref.current?.appendChild(utterances);
  }, []);

  return <div ref={ref} className="mt-12" />;
};

export default Comment;
