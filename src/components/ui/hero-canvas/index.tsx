"use client";

import { useEffect, useRef } from "react";
import {
  buildKnot,
  hashSeed,
  KNOT_SPIN,
  KNOT_TILT,
  projectKnot,
} from "@/lib/knot";
import type { KnotMode } from "@/lib/knot";
import { subscribeResolvedTheme } from "@/lib/theme";

interface HeroCanvasProps {
  mode: KnotMode;
  seed: string;
}

const FRAME_MS = 1000 / 30; // 30fps 상한
const SPEED = 0.04; // rad/s (약 157초에 한 바퀴)
const IDLE_MS = 40_000; // 입력 없이 이만큼 지나면 마지막 프레임에서 멈춘다
const PARALLAX = 0.08; // rad
const DRAG = 0.008; // rad/px
const TAU = Math.PI * 2;

// 홈 hero 매듭의 캔버스 섬. React 상태 없이 effect 하나가 모든 것을 명령형으로 다루고 전부 정리한다.
// - 화면 안 + 탭이 보일 때만 그린다(IntersectionObserver, visibilitychange)
// - prefers-reduced-motion: 정지 프레임 하나(드래그로만 돌릴 수 있다)
// - 포인터 시차와 드래그는 정밀 포인터(pointer: fine)에서만. 터치는 핸들러가 아무것도 하지 않아 스크롤을 잡지 않는다
// - DPR 상한 2(바뀌면 matchMedia 로 다시 그림), 색과 최대 불투명도는 CSS(--object, --object-alpha)에서 읽고 테마가 바뀌면 다시 읽는다
// - 점마다 불투명도를 따로 줘서(구간 없음) 깊이 감쇠에 띠가 생기지 않는다
const HeroCanvas = ({ mode, seed }: HeroCanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const fig = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !fig || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    const seedNum = hashSeed(seed);

    let pts: Float32Array | null = null;
    let proj: Float32Array | undefined;
    let rings = 0;
    let size = 0;
    let dpr = 0;
    let color = ""; // readStyle() 가 첫 draw 전에 채운다
    let amax = 0.7;

    let spin = KNOT_SPIN;
    let tilt = KNOT_TILT;
    let t = 0;
    let px = 0;
    let py = 0;
    let targetX = 0;
    let targetY = 0;

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

    const ensure = () => {
      const w = fig.clientWidth;
      if (!w) return false;
      const d = Math.min(2, window.devicePixelRatio || 1);
      if (w !== size || d !== dpr) {
        size = w;
        dpr = d;
        canvas.width = Math.round(w * d);
        canvas.height = canvas.width;
        const n = w >= 140 ? 150 : 110;
        if (n !== rings) {
          rings = n;
          pts = buildKnot(n, n === 150 ? 6 : 5, mode, seedNum);
          proj = undefined;
        }
      }
      return true;
    };

    const readStyle = () => {
      const cs = getComputedStyle(fig);
      color = cs.color;
      amax = parseFloat(cs.getPropertyValue("--object-alpha")) || 0.7;
    };

    const draw = () => {
      if (!ensure() || !pts) return;
      proj = projectKnot(
        pts,
        size,
        spin + px,
        tilt + py + 0.05 * Math.sin(0.12 * t),
        proj,
      );
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;
      const r0 = size >= 140 ? 0.62 : 0.55;
      for (let o = 0; o < proj.length; o += 3) {
        const a = proj[o + 2];
        ctx.globalAlpha = amax * a;
        ctx.beginPath();
        ctx.arc(proj[o], proj[o + 1], r0 * (0.8 + 0.7 * a), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!ready) {
        ready = true;
        fig.setAttribute("data-ready", "");
      }
    };

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
        if (!dragging) {
          spin += SPEED * dt;
          t += dt;
        }
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

    // 입력: 정밀 포인터만. matches 는 핸들러 안에서 확인하므로 change 때 다시 묶을 필요가 없다.
    const usable = (e: PointerEvent) =>
      fine.matches && e.pointerType !== "touch";

    const onHover = (e: PointerEvent) => {
      if (!usable(e) || reduce.matches || e.buttons) return;
      const rect = fig.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = PARALLAX * ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = PARALLAX * ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      wake();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
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
      spin += (e.clientX - lx) * DRAG;
      tilt = Math.max(-1.1, Math.min(1.1, tilt + (e.clientY - ly) * DRAG));
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

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const onMotion = () => {
      stop();
      if (reduce.matches) {
        // 정지 프레임은 SVG 와 같은 기본 각도로 그린다
        spin = KNOT_SPIN;
        tilt = KNOT_TILT;
        t = 0;
        px = py = targetX = targetY = 0;
        if (visible) draw();
      } else {
        wake();
      }
    };

    readStyle();

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
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => {
        if (visible) draw();
      });
      ro.observe(fig);
    }

    // 브라우저 확대나 모니터 이동으로 DPR 이 바뀌면 상자 크기가 같아 ResizeObserver 가 울리지 않는다.
    // 루프가 멈춘 상태(유휴, reduced motion)에서도 선명하게 다시 그리고, 새 DPR 로 다시 건다.
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

    fig.addEventListener("pointermove", onHover);
    fig.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onDrag);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onMotion);

    return () => {
      stop();
      io?.disconnect();
      ro?.disconnect();
      dprQuery?.removeEventListener("change", onDpr);
      unsubscribeTheme();
      fig.removeEventListener("pointermove", onHover);
      fig.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onDrag);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onMotion);
      fig.removeAttribute("data-ready");
    };
  }, [mode, seed]);

  return <canvas ref={ref} />;
};

export default HeroCanvas;
