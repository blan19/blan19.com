"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Icon from "@/components/ui/icon";
import { TocList } from "@/components/ui/toc";
import type { TocItem } from "@/lib/markdown/types";

interface TocSpyProps {
  items: TocItem[];
}

const RING = 62.83; // 2π × r(10)

// 스크롤 위치에 따라 목차의 현재 섹션, 진행률, 모바일 pill 을 갱신한다.
// 활성/진행률/pill 표시는 DOM 에 직접 쓰고, React 상태는 pill 의 현재 섹션 이름 하나뿐이다.
const TocSpy = ({ items }: TocSpyProps) => {
  const [current, setCurrent] = useState("");
  const pillRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const body = document.getElementById("post-body");
    if (!body || items.length === 0) return;
    const head = document.getElementById("post-head");
    const headings = Array.from(
      body.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    ).filter((heading) => !heading.closest(".footnotes"));
    const names = new Map(items.map((item) => [item.id, item.text]));
    const order = new Map(headings.map((heading, index) => [heading.id, index]));
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("[data-toc] a"),
    );
    const tracks = Array.from(
      document.querySelectorAll<HTMLElement>("[data-toc-track]"),
    );
    const percents = Array.from(
      document.querySelectorAll<HTMLElement>("[data-toc-pct]"),
    );
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const offset = Math.min(160, viewport * 0.3);
      let active = -1;
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top - offset <= 0) active = index;
      });

      for (const link of links) {
        const index = order.get(link.dataset.id ?? "") ?? -1;
        const isActive = index !== -1 && index === active;
        link.classList.toggle("active", isActive);
        link.classList.toggle("read", index !== -1 && index < active);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }

      for (const track of tracks) {
        const link = track.querySelector<HTMLAnchorElement>("a.active");
        track.classList.toggle("has-active", link !== null);
        if (!link) continue;
        const y = link.offsetTop + link.offsetHeight / 2 - 3.5;
        track.style.setProperty("--dot-y", `${y}px`);
        const top = link.offsetTop;
        const bottom = top + link.offsetHeight;
        if (top < track.scrollTop || bottom > track.scrollTop + track.clientHeight) {
          track.scrollTop = top - track.clientHeight / 2;
        }
      }

      const rect = body.getBoundingClientRect();
      const progress =
        rect.bottom <= viewport
          ? 1
          : Math.min(1, Math.max(0, (-rect.top + viewport * 0.35) / rect.height));
      const percent = `${Math.round(progress * 100)}%`;
      for (const element of percents) element.textContent = percent;

      const pill = pillRef.current;
      if (pill) {
        const pastHead = head ? head.getBoundingClientRect().bottom < 0 : true;
        const show = pastHead && rect.bottom > viewport * 0.6;
        pill.classList.toggle("show", show);
        pill.inert = !show;
      }
      ringRef.current?.style.setProperty(
        "stroke-dashoffset",
        String(RING * (1 - progress)),
      );

      const id = active === -1 ? undefined : headings[active].id;
      setCurrent((id && names.get(id)) ?? "");
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(schedule, {
      rootMargin: "0px 0px -70% 0px",
    });
    for (const heading of headings) observer.observe(heading);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  if (items.length === 0) return null;

  const openSheet = () => sheetRef.current?.showModal();
  const closeSheet = () => sheetRef.current?.close();
  const handleSheetClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      closeSheet();
      return;
    }
    if ((event.target as Element).closest("a")) closeSheet();
  };

  return (
    <>
      <button
        type="button"
        className="toc-pill"
        ref={pillRef}
        aria-haspopup="dialog"
        aria-label={current ? `목차 열기, 현재 섹션 ${current}` : "목차 열기"}
        inert
        onClick={openSheet}
      >
        <svg className="toc-pill-ring" viewBox="0 0 26 26" aria-hidden="true">
          <circle className="ring-bg" cx="13" cy="13" r="10" />
          <circle
            className="ring-fg"
            ref={ringRef}
            cx="13"
            cy="13"
            r="10"
            strokeDasharray={RING}
            strokeDashoffset={RING}
          />
        </svg>
        <span className="pill-text">{current || "목차"}</span>
        <Icon name="list" />
      </button>
      <dialog
        className="toc-sheet"
        ref={sheetRef}
        aria-label="목차"
        onClick={handleSheetClick}
      >
        <div className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head">
          <p>목차</p>
          <button
            type="button"
            className="sheet-close"
            aria-label="목차 닫기"
            onClick={closeSheet}
          >
            <Icon name="x" />
          </button>
        </div>
        <TocList items={items} />
      </dialog>
    </>
  );
};

export default TocSpy;
