"use client";

import { useEffect, useRef } from "react";
import type { LaptopMode, LaptopScale } from "@/lib/laptop";
import { createLaptopCanvas } from "@/lib/laptop-canvas";

interface HeroCanvasProps {
  mode: LaptopMode;
  seed: string;
  fit: LaptopScale; // 서버 laptopSvg 가 계산한 맞춤(클라이언트에서 다시 계산하지 않는다)
}

// 홈 hero 노트북의 캔버스 섬. React 상태 없이 effect 하나가 엔진(src/lib/laptop-canvas.ts)을 붙이고 정리한다.
// 규칙(30fps, 유휴 정지, 화면/탭 가시성, reduced motion, 정밀 포인터, DPR 상한)은 엔진 머리 주석에 있다.
const HeroCanvas = ({ mode, seed, fit }: HeroCanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  // RSC 가 다시 보낸 같은 값의 새 객체로 엔진이 재시작하지 않게 숫자로 비교한다
  const { s, cx, cy } = fit;

  useEffect(() => {
    const canvas = ref.current;
    const fig = canvas?.parentElement;
    if (!canvas || !fig) return;
    return createLaptopCanvas(canvas, fig, { mode, seed, fit: { s, cx, cy } });
  }, [mode, seed, s, cx, cy]);

  return <canvas ref={ref} />;
};

export default HeroCanvas;
