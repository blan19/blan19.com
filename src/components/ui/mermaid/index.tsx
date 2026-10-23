"use client";

import { useEffect, useId, useRef, useState } from "react";
import { subscribeResolvedTheme } from "@/lib/theme";

interface MermaidProps {
  code: string;
  caption?: string;
}

type DiagramState = "pending" | "ready" | "error";

const COMPACT_QUERY = "(max-width: 767px)";
// 모바일에서는 가로 흐름(LR/RL)을 세로(TD)로 다시 그린다. 앞쪽 %% 주석/설정 줄은 허용한다.
const HORIZONTAL_FLOW = /^(\s*(?:%%[^\n]*\n\s*)*)(flowchart|graph)(\s+)(LR|RL)\b/;

// 공백이 붙은 값은 mermaid 색 파서가 거부하므로 trim 한다.
const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const Mermaid = ({ code, caption }: MermaidProps) => {
  const [state, setState] = useState<DiagramState>("pending");
  const figureRef = useRef<HTMLElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reactId = useId();

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    const baseId = `mmd-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const compactQuery = window.matchMedia(COMPACT_QUERY);
    let disposed = false;
    let started = false;
    let count = 0;
    let queue: Promise<void> = Promise.resolve();

    const render = async () => {
      const id = `${baseId}-${(count += 1)}`;
      try {
        const { default: mermaid } = await import("mermaid");
        await document.fonts.ready;
        if (disposed) return;
        const compact = compactQuery.matches;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: cssVar("--sans"),
          flowchart: {
            curve: "basis",
            htmlLabels: true,
            useMaxWidth: false,
            nodeSpacing: compact ? 14 : 28,
            rankSpacing: compact ? 38 : 46,
            padding: compact ? 10 : 14,
          },
          themeVariables: {
            fontSize: compact ? "13px" : "14px",
            background: cssVar("--bg"),
            primaryColor: cssVar("--bg-subtle"),
            primaryTextColor: cssVar("--text"),
            primaryBorderColor: cssVar("--line-strong"),
            secondaryColor: cssVar("--bg-subtle"),
            tertiaryColor: cssVar("--bg"),
            lineColor: cssVar("--text-3"),
            textColor: cssVar("--text-2"),
            edgeLabelBackground: cssVar("--bg"),
            clusterBkg: cssVar("--bg-subtle"),
            clusterBorder: cssVar("--line"),
            fontFamily: cssVar("--sans"),
          },
        });
        const source = compact ? code.replace(HORIZONTAL_FLOW, "$1$2$3TD") : code;
        const { svg } = await mermaid.render(id, source);
        const plate = plateRef.current;
        const scroll = scrollRef.current;
        if (disposed || !plate || !scroll) return;
        // 다시 그릴 때 높이가 튀지 않게 이전 높이를 잡아 두었다가 교체 후 푼다.
        if (scroll.childElementCount > 0) {
          plate.style.minHeight = `${plate.offsetHeight}px`;
        }
        scroll.innerHTML = svg;
        scroll.querySelector("svg")?.style.removeProperty("max-width");
        requestAnimationFrame(() => plate.style.removeProperty("min-height"));
        setState("ready");
      } catch (error) {
        document.getElementById(`d${id}`)?.remove();
        if (disposed) return;
        console.error("[mermaid] 다이어그램을 그리지 못했습니다", error);
        // 이미 그려 둔 그림이 있으면(테마 전환 재렌더 실패) 그대로 둔다.
        if (!scrollRef.current?.querySelector("svg")) setState("error");
      }
    };

    const schedule = () => {
      queue = queue.then(render);
    };
    const rerender = () => {
      if (started) schedule();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        started = true;
        schedule();
      },
      { rootMargin: "400px" },
    );
    observer.observe(figure);
    const unsubscribe = subscribeResolvedTheme(rerender);
    compactQuery.addEventListener("change", rerender);

    return () => {
      disposed = true;
      observer.disconnect();
      unsubscribe();
      compactQuery.removeEventListener("change", rerender);
    };
  }, [code, reactId]);

  return (
    <figure className="diagram" data-state={state} ref={figureRef}>
      <div className="diagram-plate" ref={plateRef}>
        <div className="diagram-scroll" ref={scrollRef} />
        {state === "error" && (
          <p className="diagram-status">
            다이어그램을 불러오지 못해 소스를 보여 드려요.
          </p>
        )}
        {state !== "ready" && <pre className="diagram-src">{code}</pre>}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
};

export default Mermaid;
