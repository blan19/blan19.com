// 홈 hero 노트북의 캔버스 엔진(브라우저 전용, DOM 사용). ui/hero-canvas 의 effect 가 부르고
// 돌려받은 dispose 로 모두 정리한다. 기하는 laptop.ts(서버와 공용)에 있고 여기는 그리기와 스케줄만 다룬다.
// - 화면 안 + 탭이 보일 때만 그린다(IntersectionObserver, visibilitychange), 30fps 상한, 입력 없이 40초면 멈춘다
// - 첫 프레임(t = 0)은 서버 SVG 와 같은 자세, 같은 맞춤(viewBox 360×240, 서버가 계산한 fit), 같은 불투명도 칸이다
// - prefers-reduced-motion: SVG 와 같은 t = 0 정지 프레임 하나(정밀 포인터 드래그로만 돌릴 수 있다)
// - 포인터 시차와 드래그는 정밀 포인터(pointer: fine)에서만. 터치는 핸들러가 아무것도 하지 않아 스크롤을 잡지 않는다
// - 드래그는 yaw ±0.35, pitch 는 기본 ±0.12 안에서만(덮개 뒷면이 보이지 않게)
// - DPR 상한 2(바뀌면 matchMedia 로 다시 그림), 색과 최대 불투명도는 CSS(--object, --object-alpha)에서 읽고 테마가 바뀌면 다시 읽는다
// - 점은 불투명도 칸마다 path 하나 + fill 하나로 그린다
// - 상자 크기(clientWidth/Height)는 ResizeObserver 때만, 시차용 상자 위치는 포인터가 들어온 뒤 스크롤/크기 변화 때만 다시 읽는다
import {
  buildLaptop,
  hashSeed,
  LAPTOP_BUCKETS,
  LAPTOP_DRAG_PITCH,
  LAPTOP_DRAG_YAW,
  LAPTOP_PARALLAX_PITCH,
  LAPTOP_PARALLAX_YAW,
  LAPTOP_VIEW_H,
  LAPTOP_VIEW_W,
  laptopBucket,
  laptopBucketAlpha,
  laptopBucketRadius,
  laptopDotCount,
  laptopPose,
  laptopScrubAt,
  laptopYawAt,
  projectLaptop,
} from "@/lib/laptop";
import type { LaptopMode, LaptopScale } from "@/lib/laptop";
import { subscribeResolvedTheme } from "@/lib/theme";

export interface LaptopCanvasOptions {
  mode: LaptopMode;
  seed: string;
  fit: LaptopScale; // viewBox 단위, 서버 laptopSvg 의 fit
}

const FRAME_MS = 1000 / 30; // 30fps 상한
const IDLE_MS = 40_000; // 입력 없이 이만큼 지나면 마지막 프레임에서 멈춘다
const DRAG = 0.006; // rad/px
const TAU = Math.PI * 2;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// canvas 는 fig(상자)의 자식이다. 첫 프레임을 그리면 fig 에 data-ready 를 붙인다(CSS 가 SVG → 캔버스 교차).
export const createLaptopCanvas = (
  canvas: HTMLCanvasElement,
  fig: HTMLElement,
  { mode, seed, fit: baseFit }: LaptopCanvasOptions,
): (() => void) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(pointer: fine)");
  const pts = buildLaptop(mode, hashSeed(seed));
  const pose = laptopPose(mode);
  const bucketOf = new Int8Array(laptopDotCount(pts));
  const hasRO = "ResizeObserver" in window;

  let proj: Float32Array | undefined;
  let boxW = 0; // 상자 clientWidth/Height. ResizeObserver 가 있으면 그 콜백에서만 다시 읽는다
  let boxH = 0;
  let rect: DOMRect | undefined; // 시차용 상자 위치. 비우면 다음 pointermove 가 다시 읽는다
  let w = 0;
  let h = 0;
  let dpr = 0;
  let k = 1; // viewBox → CSS px
  let fit = baseFit;
  let color = ""; // readStyle() 가 첫 draw 전에 채운다
  let amax = 0.7;

  let t = 0;
  let px = 0;
  let py = 0;
  let targetX = 0;
  let targetY = 0;
  let dragYaw = 0;
  let dragPitch = 0;

  let running = false;
  let visible = false;
  let ready = false;
  let raf = 0;
  let last = 0;
  let drawn = 0;
  let lastInput = 0;
  let dragging = false;
  let lx = 0;
  let ly = 0;

  // ── 크기와 스타일 ──
  const measure = () => {
    boxW = fig.clientWidth;
    boxH = fig.clientHeight;
  };

  const ensure = () => {
    if (!hasRO) measure();
    if (!boxW || !boxH) return false;
    const d = Math.min(2, window.devicePixelRatio || 1);
    if (boxW !== w || boxH !== h || d !== dpr) {
      w = boxW;
      h = boxH;
      dpr = d;
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      // SVG 의 preserveAspectRatio(xMidYMid meet)와 같은 맞춤
      k = Math.min(w / LAPTOP_VIEW_W, h / LAPTOP_VIEW_H);
      fit = {
        s: baseFit.s * k,
        cx: baseFit.cx * k + (w - LAPTOP_VIEW_W * k) / 2,
        cy: baseFit.cy * k + (h - LAPTOP_VIEW_H * k) / 2,
      };
    }
    return true;
  };

  const readStyle = () => {
    const cs = getComputedStyle(fig);
    color = cs.color;
    amax = parseFloat(cs.getPropertyValue("--object-alpha")) || 0.7;
  };

  // ── 그리기 ──
  const draw = () => {
    if (!ensure()) return;
    const { progress, fade } = laptopScrubAt(t);
    const yaw = (mode === "scatter" ? pose.yaw : laptopYawAt(t)) + px + dragYaw;
    const pitch = clamp(
      pose.pitch + py + dragPitch,
      pose.pitch - LAPTOP_DRAG_PITCH,
      pose.pitch + LAPTOP_DRAG_PITCH,
    );
    proj = projectLaptop(pts, fit, yaw, pitch, progress, fade, proj);
    for (let i = 0, o = 0; o < proj.length; i++, o += 3) {
      bucketOf[i] = laptopBucket(proj[o + 2]);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    for (let b = 0; b < LAPTOP_BUCKETS; b++) {
      const r = laptopBucketRadius(b) * k;
      let any = false;
      ctx.beginPath();
      for (let i = 0, o = 0; o < proj.length; i++, o += 3) {
        if (bucketOf[i] !== b) continue;
        ctx.moveTo(proj[o] + r, proj[o + 1]);
        ctx.arc(proj[o], proj[o + 1], r, 0, TAU);
        any = true;
      }
      if (!any) continue;
      ctx.globalAlpha = Math.min(1, amax * laptopBucketAlpha(b));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!ready) {
      ready = true;
      fig.setAttribute("data-ready", "");
    }
  };

  // ── 스케줄 ──
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  const loop = (ts: number) => {
    if (!running) return;
    if (!dragging && ts - lastInput > IDLE_MS) {
      stop();
      return;
    }
    if (ts - drawn >= FRAME_MS - 1) {
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
      last = ts;
      drawn = ts;
      if (!dragging) t += dt;
      px += (targetX - px) * 0.1;
      py += (targetY - py) * 0.1;
      draw();
    }
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || !visible || document.hidden) return;
    if (reduce.matches) {
      draw();
      return;
    }
    running = true;
    last = 0;
    drawn = 0;
    raf = requestAnimationFrame(loop);
  };

  const wake = () => {
    lastInput = performance.now();
    start();
  };

  // ── 입력: 정밀 포인터만. matches 는 핸들러 안에서 확인하므로 change 때 다시 묶을 필요가 없다 ──
  const usable = (e: PointerEvent) => fine.matches && e.pointerType !== "touch";

  const onHover = (e: PointerEvent) => {
    if (!usable(e) || reduce.matches || e.buttons) return;
    rect ??= fig.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetX = LAPTOP_PARALLAX_YAW * ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = LAPTOP_PARALLAX_PITCH * ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    wake();
  };

  const onLeave = () => {
    targetX = 0;
    targetY = 0;
    rect = undefined;
  };

  const onDown = (e: PointerEvent) => {
    if (!usable(e) || e.button !== 0) return;
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    wake();
  };

  const onDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragYaw = clamp(dragYaw + (e.clientX - lx) * DRAG, -LAPTOP_DRAG_YAW, LAPTOP_DRAG_YAW);
    dragPitch = clamp(dragPitch + (e.clientY - ly) * DRAG, -LAPTOP_DRAG_PITCH, LAPTOP_DRAG_PITCH);
    lx = e.clientX;
    ly = e.clientY;
    lastInput = performance.now();
    if (!running) draw();
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    wake();
  };

  // ── 환경 ──
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };

  const onMotion = () => {
    stop();
    if (reduce.matches) {
      // 정지 프레임은 SVG 와 같은 t = 0 자세로 그린다
      t = 0;
      px = py = targetX = targetY = dragYaw = dragPitch = 0;
      if (visible) draw();
    } else {
      wake();
    }
  };

  const forgetRect = () => {
    rect = undefined;
  };

  measure();
  readStyle();

  // 고정 리스너는 signal 하나로 해제한다. DPR 쿼리는 바뀔 때마다 갈아 끼우므로 따로 해제한다(아래 watchDpr).
  const ac = new AbortController();
  const { signal } = ac;
  const passive = { passive: true, signal };
  fig.addEventListener("pointermove", onHover, { signal });
  fig.addEventListener("pointerleave", onLeave, { signal });
  canvas.addEventListener("pointerdown", onDown, { signal });
  canvas.addEventListener("pointermove", onDrag, { signal });
  canvas.addEventListener("pointerup", onUp, { signal });
  canvas.addEventListener("pointercancel", onUp, { signal });
  window.addEventListener("scroll", forgetRect, passive);
  window.addEventListener("resize", forgetRect, passive);
  document.addEventListener("visibilitychange", onVisibility, { signal });
  reduce.addEventListener("change", onMotion, { signal });

  let io: IntersectionObserver | undefined;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) {
        draw();
        wake();
      } else {
        stop();
      }
    });
    io.observe(fig);
  } else {
    visible = true;
    draw();
    wake();
  }

  let ro: ResizeObserver | undefined;
  if (hasRO) {
    ro = new ResizeObserver(() => {
      measure();
      rect = undefined;
      if (visible) draw();
    });
    ro.observe(fig);
  }

  // 브라우저 확대나 모니터 이동으로 DPR 이 바뀌면 상자 크기가 같아 ResizeObserver 가 울리지 않는다.
  // 루프가 멈춘 상태(유휴, reduced motion)에서도 선명하게 다시 그리고, 새 DPR 로 다시 건다.
  // 이전 쿼리의 리스너는 반드시 떼어 낸다(signal 에 묶으면 DPR 이 오갈 때 옛 쿼리가 다시 울려 쌓인다).
  let dprQuery: MediaQueryList | undefined;
  const onDpr = () => {
    watchDpr();
    if (visible) draw();
  };
  const watchDpr = () => {
    dprQuery?.removeEventListener("change", onDpr);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener("change", onDpr);
  };
  watchDpr();

  const unsubscribeTheme = subscribeResolvedTheme(() => {
    readStyle();
    if (visible) draw();
  });

  return () => {
    stop();
    ac.abort();
    io?.disconnect();
    ro?.disconnect();
    dprQuery?.removeEventListener("change", onDpr);
    unsubscribeTheme();
    fig.removeAttribute("data-ready");
  };
};
