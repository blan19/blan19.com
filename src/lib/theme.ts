// 테마 API. 브라우저 전용 함수 모음이다("use client" 아님). 서버에서 import 해도 호출하지 않으면 안전하다.
// 첫 페인트 전 data-theme 설정은 src/app/layout.tsx 의 인라인 스크립트(THEME_INIT)가 한다(THEME_STORAGE_KEY 를 그대로 넣는다).

export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
// CustomEvent<{ pref: ThemePref; resolved: ResolvedTheme }>
export const THEME_EVENT = "blan19:themechange";

// --bg 와 같은 값. layout.tsx 의 viewport.themeColor 와 공유한다.
export const THEME_COLORS = { light: "#F8F9FA", dark: "#16181B" } as const;

const DARK_QUERY = "(prefers-color-scheme: dark)";

export interface ThemeChangeDetail {
  pref: ThemePref;
  resolved: ResolvedTheme;
}

export function readThemePref(): ThemePref {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(pref: ThemePref = readThemePref()): ResolvedTheme {
  if (pref !== "system") return pref;
  try {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

// viewport.themeColor 가 만든 두 meta 는 OS 설정(media)만 따른다.
// 강제 테마면 두 meta 를 그 색으로 덮고, system 이면 각 meta 의 media 에 맞는 원래 색으로 되돌린다.
export function syncThemeColor(pref: ThemePref): void {
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  metas.forEach((meta) => {
    if (pref !== "system") {
      meta.content = THEME_COLORS[pref];
      return;
    }
    const media = meta.getAttribute("media") ?? "";
    meta.content = media.includes("dark") ? THEME_COLORS.dark : THEME_COLORS.light;
  });
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // 저장소를 쓸 수 없어도 이번 페이지에는 적용한다.
  }
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  syncThemeColor(pref);
  window.dispatchEvent(
    new CustomEvent<ThemeChangeDetail>(THEME_EVENT, {
      detail: { pref, resolved: resolveTheme(pref) },
    }),
  );
}

// 설정 변경(THEME_EVENT)과, 설정이 system 일 때의 OS 테마 변경을 구독한다.
export function subscribeResolvedTheme(cb: (t: ResolvedTheme) => void): () => void {
  const onThemeChange = (event: Event) => {
    const detail = (event as CustomEvent<ThemeChangeDetail>).detail;
    cb(detail?.resolved ?? resolveTheme());
  };
  window.addEventListener(THEME_EVENT, onThemeChange);

  let mql: MediaQueryList | undefined;
  const onMediaChange = () => {
    if (readThemePref() === "system") cb(resolveTheme("system"));
  };
  try {
    mql = window.matchMedia(DARK_QUERY);
    mql.addEventListener("change", onMediaChange);
  } catch {
    mql = undefined;
  }

  return () => {
    window.removeEventListener(THEME_EVENT, onThemeChange);
    mql?.removeEventListener("change", onMediaChange);
  };
}
