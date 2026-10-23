import { KNOT_VIEWBOX, knotSvgLayers } from "@/lib/knot";
import type { KnotMode } from "@/lib/knot";
import HeroCanvas from "@/components/ui/hero-canvas";

interface HeroObjectProps {
  mode: KnotMode;
  seed: string;
  animate?: boolean;
}

// 장식용 점묘 매듭. 서버에서 같은 점을 SVG 로 그려 두므로 JS 가 없어도 최종 이미지이고,
// 상자 크기가 고정(--obj)이라 캔버스가 떠도 레이아웃이 움직이지 않는다.
// animate 면 클라이언트 섬(HeroCanvas)이 첫 프레임을 그린 뒤 data-ready 로 SVG 와 교차한다.
const HeroObject = ({ mode, seed, animate = false }: HeroObjectProps) => {
  const layers = knotSvgLayers(mode, seed);

  return (
    <figure className="hero-obj" data-mode={mode} aria-hidden="true">
      <svg
        viewBox={`0 0 ${KNOT_VIEWBOX} ${KNOT_VIEWBOX}`}
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
      {animate && <HeroCanvas mode={mode} seed={seed} />}
    </figure>
  );
};

export default HeroObject;
