"use client";

import { useEffect, useRef, useState } from "react";
import { comments } from "@/lib/config";
import { PAGE_IDS } from "@/lib/page-ids";
import { resolveTheme, subscribeResolvedTheme } from "@/lib/theme";
import type { ResolvedTheme } from "@/lib/theme";

const ORIGIN = "https://utteranc.es";
const SESSION_KEY = "utterances-session"; // client.js 와 같은 키(이 사이트 origin 의 localStorage)

const uttTheme = (theme: ResolvedTheme) =>
  theme === "dark" ? "github-dark" : "github-light";

// GitHub 로그인 뒤 utterances 가 ?utterances=<session> 을 붙여 이 글로 돌려보낸다.
// 저장하고 주소에서 지운다(공유 링크로 새지 않게). 없으면 저장해 둔 값을 쓴다.
const takeSession = () => {
  const url = new URL(location.href);
  const token = url.searchParams.get("utterances");
  if (token) {
    try {
      localStorage.setItem(SESSION_KEY, token);
    } catch {}
    url.searchParams.delete("utterances");
    history.replaceState(null, "", url);
    return token;
  }
  try {
    return localStorage.getItem(SESSION_KEY) ?? "";
  } catch {
    return "";
  }
};

const metaContent = (selector: string) =>
  document.querySelector<HTMLMetaElement>(selector)?.content ?? "";

// utterances client.js 가 iframe 에 넘기는 쿼리를 그대로 만든다(utterances.html 의 비공개 계약).
// script 속성 중 crossorigin, async 는 iframe 이 쓰지 않아 뺐다.
const frameSrc = (session: string) => {
  const canonical = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
  let description = metaContent("meta[name='description']");
  // 414 URI Too Long 을 피하려는 client.js 의 절단 규칙
  const len = encodeURIComponent(description).length;
  if (len > 1000) {
    description = description.slice(0, Math.floor((description.length * 1000) / len));
  }
  const attrs = {
    src: `${ORIGIN}/client.js`,
    repo: comments.repo,
    "issue-term": comments.issueTerm,
    label: comments.label,
    theme: uttTheme(resolveTheme()),
    url: canonical ? canonical.href : location.origin + location.pathname + location.search,
    origin: location.origin,
    pathname:
      location.pathname.length < 2
        ? "index"
        : location.pathname.slice(1).replace(/\.\w+$/, ""),
    title: document.title,
    description,
    "og:title": metaContent("meta[property='og:title'],meta[name='og:title']"),
    session,
  };
  return `${ORIGIN}/utterances.html?${new URLSearchParams(attrs)}`;
};

// 글마다 새로 마운트되도록 페이지에서 <Comment key={slug} /> 로 쓴다.
// utterances iframe 을 직접 띄운다(client.js 를 이 페이지에서 실행하지 않는다). 높이는 iframe 이 보내는
// resize 메시지로 맞추고, 테마는 set-theme 메시지로 따라간다. 리스너는 effect 정리 때 모두 해제한다.
// src 는 댓글 영역이 가까워질 때 정한다(글 간 이동 직후에는 document.title 등이 아직 이전 글일 수 있다).
const Comment = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    if (!section || !frame) return;
    const session = takeSession();

    const load = () => {
      if (!frame.getAttribute("src")) frame.src = frameSrc(session);
    };
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          io?.disconnect();
          load();
        },
        { rootMargin: "0px 0px 800px 0px" },
      );
      io.observe(section);
    } else {
      load();
    }

    // iframe 이 utteranc.es 문서를 띄우기 전(about:blank)에는 postMessage 가 origin 불일치로 버려진다.
    // 첫 메시지를 받은 뒤부터 보내고, 그 사이에 바뀐 테마는 그때 한 번 맞춘다.
    let ready = false;
    const postTheme = (theme: ResolvedTheme) => {
      if (!ready) return;
      frame.contentWindow?.postMessage({ type: "set-theme", theme: uttTheme(theme) }, ORIGIN);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== ORIGIN || event.source !== frame.contentWindow) return;
      if (!ready) {
        ready = true;
        postTheme(resolveTheme());
      }
      const data = event.data as { type?: string; height?: number } | null;
      if (data?.type !== "resize" || !data.height) return;
      frame.style.height = `${data.height}px`;
      setLoaded(true);
    };
    window.addEventListener("message", onMessage);

    const unsubscribe = subscribeResolvedTheme(postTheme);

    return () => {
      io?.disconnect();
      window.removeEventListener("message", onMessage);
      unsubscribe();
    };
  }, []);

  return (
    <section
      className="end-sec comments"
      aria-labelledby={PAGE_IDS.commentLabel}
      ref={sectionRef}
    >
      <h2 className="end-label" id={PAGE_IDS.commentLabel}>
        댓글
      </h2>
      {!loaded && (
        <div className="skel" aria-hidden="true">
          <span className="bar bar-long" />
          <span className="bar bar-mid" />
          <p className="note">GitHub 계정으로 댓글을 남길 수 있습니다.</p>
        </div>
      )}
      <div className="utt-host">
        {/* 높이는 첫 resize 메시지 전까지 0. width 1px + min-width 100% 는 client.js 의 iOS Safari 대응을 따랐다.
            style 값은 Tailwind 가 유틸리티로 읽는 낱말(위치, 테두리 이름)을 피해 썼다. */}
        <iframe
          className="utterances-frame"
          ref={frameRef}
          title="댓글"
          scrolling="no"
          style={{
            display: "block",
            width: 1,
            minWidth: "100%",
            maxWidth: "100%",
            height: 0,
            borderStyle: "none",
            colorScheme: "light",
          }}
        />
      </div>
    </section>
  );
};

export default Comment;
