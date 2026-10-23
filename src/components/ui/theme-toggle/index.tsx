"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import Icon from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import {
  readThemePref,
  setThemePref,
  subscribeResolvedTheme,
  syncThemeColor,
} from "@/lib/theme";
import type { ThemePref } from "@/lib/theme";

const options: { pref: ThemePref; label: string; icon: IconName }[] = [
  { pref: "system", label: "시스템", icon: "system" },
  { pref: "light", label: "라이트", icon: "sun" },
  { pref: "dark", label: "다크", icon: "moon" },
];

const subscribePref = (onChange: () => void) => subscribeResolvedTheme(() => onChange());
// 서버와 하이드레이션 중에는 system 으로 그린다(저장값은 하이드레이션 뒤에 반영된다).
const getServerPref = (): ThemePref => "system";

const getItems = (menu: HTMLElement | null) =>
  Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);

const ThemeToggle = () => {
  const pref = useSyncExternalStore(subscribePref, readThemePref, getServerPref);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const current = options.find((option) => option.pref === pref) ?? options[0];

  // viewport.themeColor 의 meta 는 OS 설정만 따르므로 저장된 강제 테마 색으로 한 번 맞춘다.
  useEffect(() => {
    syncThemeColor(readThemePref());
  }, []);

  // 열리면 선택된 항목에 포커스, 바깥 클릭과 Escape 로 닫는다.
  useEffect(() => {
    if (!open) return;

    const items = getItems(menuRef.current);
    (items.find((item) => item.getAttribute("aria-checked") === "true") ?? items[0])?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (next: ThemePref) => {
    setThemePref(next);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = getItems(menuRef.current);
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);

    let next: number | undefined;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Tab") {
      setOpen(false);
      return;
    }

    if (next === undefined) return;
    event.preventDefault();
    items[next].focus();
  };

  return (
    <div className="theme" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`테마: ${current.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={current.icon} />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        className="theme-menu"
        role="menu"
        aria-label="테마"
        data-open={open ? "" : undefined}
        onKeyDown={onMenuKeyDown}
      >
        {options.map((option) => (
          <button
            key={option.pref}
            type="button"
            role="menuitemradio"
            aria-checked={option.pref === pref}
            tabIndex={-1}
            onClick={() => select(option.pref)}
          >
            <Icon name={option.icon} />
            {option.label}
            <Icon name="check" className="theme-check" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeToggle;
