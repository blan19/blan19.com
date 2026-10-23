import type { CSSProperties } from "react";
import { LAPTOP_VIEW_H, LAPTOP_VIEW_W, laptopSvg } from "@/lib/laptop";
import type { LaptopMode } from "@/lib/laptop";
import HeroCanvas from "@/components/ui/hero-canvas";

interface HeroObjectProps {
  mode: LaptopMode;
  seed: string;
  animate?: boolean;
}

// 장식용 점묘 노트북. 서버에서 같은 점을 SVG 로 그려 두므로 JS 가 없어도 최종 이미지이고,
// 상자 크기가 고정(--obj-w, 3:2)이라 캔버스가 떠도 레이아웃이 움직이지 않는다.
// animate 면 클라이언트 섬(HeroCanvas)이 서버가 계산한 맞춤(fit)으로 첫 프레임을 그린 뒤 data-ready 로 SVG 와 교차한다.
// --obj-slack-l/r: 맞춤이 높이로 정해져 남는 가로 폭(상자 너비 대비). CSS 가 상자를 그만큼 옮겨
// 잉크를 ≥768 에서는 본문 열 오른쪽 끝, <768 에서는 글 왼쪽 끝에 맞춘다(SVG 와 캔버스가 같이 움직인다).
const HeroObject = ({ mode, seed, animate = false }: HeroObjectProps) => {
  const { layers, slackL, slackR, fit } = laptopSvg(mode, seed);
  const style = {
    "--obj-slack-l": slackL,
    "--obj-slack-r": slackR,
  } as CSSProperties;

  return (
    <figure
      className="hero-obj"
      data-mode={mode}
      aria-hidden="true"
      style={style}
    >
      <svg
        viewBox={`0 0 ${LAPTOP_VIEW_W} ${LAPTOP_VIEW_H}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        focusable="false"
      >
        {layers.map((layer) => (
          <path
            key={layer.opacity}
            opacity={layer.opacity}
            strokeWidth={layer.width}
            d={layer.d}
          />
        ))}
      </svg>
      {animate && <HeroCanvas mode={mode} seed={seed} fit={fit} />}
    </figure>
  );
};

export default HeroObject;
