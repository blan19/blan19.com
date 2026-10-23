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
// 프레임마다 읽기(rect, 레일 위치)를 먼저 끝내고, 직전 값과 달라진 것만 쓴다.
// scroll 과 resize 외에, 스크롤 없이 헤딩이 밀릴 때(mermaid, 이미지, 글꼴, 조회수 로드)는 본문과 글 머리의 ResizeObserver 가 잡는다.
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
    ).map((link) => ({ link, index: order.get(link.dataset.id ?? "") ?? -1 }));
    // 레일 nav 마다 헤딩 순번 → 링크
    const rails = Array.from(
      document.querySelectorAll<HTMLElement>(".toc-rail nav"),
    ).map((nav) => ({
      nav,
      byIndex: new Map(
        links.filter(({ link }) => nav.contains(link)).map(({ link, index }) => [index, link]),
      ),
    }));
    let frame = 0;
    let lastActive = -2;
    let lastShow: boolean | undefined;
    let resized = true;

    const update = () => {
      frame = 0;

      // 읽기
      const viewport = window.innerHeight;
      const offset = Math.min(160, viewport * 0.3);
      let active = -1;
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top - offset <= 0) active = index;
      });
      const changed = active !== lastActive;

      // 레일이 스스로 스크롤될 만큼 길면 활성 링크가 보이게 맞춘다(nav 가 sticky 라 offsetParent 다).
      // 활성 항목이 바뀌거나 창 크기가 바뀔 때만 본다.
      const railScroll: [HTMLElement, number][] = [];
      if (active !== -1 && (changed || resized)) {
        for (const { nav, byIndex } of rails) {
          const link = byIndex.get(active);
          if (!link) continue;
          const top = link.offsetTop;
          const bottom = top + link.offsetHeight;
          if (top < nav.scrollTop || bottom > nav.scrollTop + nav.clientHeight) {
            railScroll.push([nav, top - nav.clientHeight / 2]);
          }
        }
      }
      resized = false;

      // 아래로 읽어 내려가는 동안은 pill 을 숨겨 화면 아래쪽 본문을 가리지 않는다. 위로 스크롤하면 다시 보인다.
      // 8px 미만의 움직임(주소창 접힘, 관성 끝 흔들림)은 방향으로 보지 않는다.
      const y = window.scrollY;
      if (Math.abs(y - lastY) >= 8) {
        scrollingDown = y > lastY;
        lastY = y;
      }

      const pill = pillRef.current;
      let show = false;
      if (pill) {
        const rect = body.getBoundingClientRect();
        const pastHead = head ? head.getBoundingClientRect().bottom < 0 : true;
        show = pastHead && rect.bottom > viewport * 0.6;
      }

      // 쓰기
      if (changed) {
        lastActive = active;
        for (const { link, index } of links) {
          const isActive = index !== -1 && index === active;
          link.classList.toggle("active", isActive);
          if (isActive) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
        const id = active === -1 ? undefined : headings[active].id;
        setCurrent((id && names.get(id)) ?? "");
      }
      for (const [nav, top] of railScroll) nav.scrollTop = top;
      if (pill && show !== lastShow) {
        lastShow = show;
        pill.classList.toggle("show", show);
        pill.inert = !show;
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      resized = true;
      schedule();
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(body);
    if (head) observer.observe(head);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
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
