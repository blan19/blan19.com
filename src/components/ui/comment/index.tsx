"use client";

import { useEffect, useRef, useState } from "react";
import { resolveTheme, subscribeResolvedTheme } from "@/lib/theme";
import type { ResolvedTheme } from "@/lib/theme";

const REPO = "blan19/blan19.xyz";
const ORIGIN = "https://utteranc.es";

const uttTheme = (theme: ResolvedTheme) =>
  theme === "dark" ? "github-dark" : "github-light";

// 글마다 새로 마운트되도록 페이지에서 <Comment key={slug} /> 로 쓴다.
const Comment = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const script = document.createElement("script");
    const attributes: Record<string, string> = {
      src: `${ORIGIN}/client.js`,
      repo: REPO,
      "issue-term": "pathname",
      label: "comment",
      theme: uttTheme(resolveTheme()),
      crossorigin: "anonymous",
      async: "true",
    };
    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    // 다음 태스크로 미룬다. 개발 모드 StrictMode 의 마운트 → 정리 → 재마운트 사이에 스크립트를
    // 넣으면, 정리로 떼어 낸 첫 스크립트가 그대로 실행되어 utterances 가 부모 없는 요소에
    // insertAdjacentHTML 을 시도하며 예외를 던진다.
    const appendTimer = window.setTimeout(() => host.appendChild(script), 0);

    const findFrame = () =>
      host.querySelector<HTMLIFrameElement>("iframe.utterances-frame");

    const observer = new MutationObserver(() => {
      if (findFrame()) {
        setLoaded(true);
        observer.disconnect();
      }
    });
    observer.observe(host, { childList: true, subtree: true });

    const unsubscribe = subscribeResolvedTheme((theme) => {
      findFrame()?.contentWindow?.postMessage(
        { type: "set-theme", theme: uttTheme(theme) },
        ORIGIN,
      );
    });

    return () => {
      window.clearTimeout(appendTimer);
      observer.disconnect();
      unsubscribe();
      host.replaceChildren();
    };
  }, []);

  return (
    <section className="end-sec comments" aria-labelledby="cm-label">
      <h2 className="end-label" id="cm-label">
        댓글
      </h2>
      {!loaded && (
        <div className="skel" aria-hidden="true">
          <span className="bar bar-long" />
          <span className="bar bar-mid" />
          <p className="note">GitHub 계정으로 댓글을 남길 수 있습니다.</p>
        </div>
      )}
      <div className="utt-host" ref={hostRef} />
    </section>
  );
};

export default Comment;
