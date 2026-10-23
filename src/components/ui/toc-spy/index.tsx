"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Icon from "@/components/ui/icon";
import { TocList } from "@/components/ui/toc";
import type { TocItem } from "@/lib/markdown/types";

interface TocSpyProps {
  items: TocItem[];
}

// 스크롤 위치에 따라 목차의 현재 섹션과 모바일 pill 을 갱신한다.
// 활성 링크와 pill 표시는 DOM 에 직접 쓰고, React 상태는 pill 의 현재 섹션 이름 하나뿐이다.
const TocSpy = ({ items }: TocSpyProps) => {
  const [current, setCurrent] = useState("");
  const pillRef = useRef<HTMLButtonElement>(null);
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
    const rails = Array.from(
      document.querySelectorAll<HTMLElement>(".toc-rail nav"),
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
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }

      // 레일이 스스로 스크롤될 만큼 길면 활성 링크가 보이게 맞춘다(nav 가 sticky 라 offsetParent 다).
      for (const nav of rails) {
        const link = nav.querySelector<HTMLAnchorElement>("a.active");
        if (!link) continue;
        const top = link.offsetTop;
        const bottom = top + link.offsetHeight;
        if (top < nav.scrollTop || bottom > nav.scrollTop + nav.clientHeight) {
          nav.scrollTop = top - nav.clientHeight / 2;
        }
      }

      const pill = pillRef.current;
      if (pill) {
        const rect = body.getBoundingClientRect();
        const pastHead = head ? head.getBoundingClientRect().bottom < 0 : true;
        const show = pastHead && rect.bottom > viewport * 0.6;
        pill.classList.toggle("show", show);
        pill.inert = !show;
      }

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
        aria-label={current ? `목차 열기. 지금 읽는 곳 ${current}` : "목차 열기"}
        inert
        onClick={openSheet}
      >
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
