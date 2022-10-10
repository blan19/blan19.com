import { useEffect, useRef } from "react";
import styled from "styled-components";

const repo = "https://github.com/blan19/Blog";

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

  return <Base ref={ref} />;
};

export default Comment;

const Base = styled.div``;
