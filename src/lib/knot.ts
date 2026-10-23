// 홈/404 의 점묘 매듭(hero object) 기하. DOM 없는 순수 함수라 서버(SVG 대체 이미지)와
// 클라이언트 섬(ui/hero-canvas)이 같이 쓴다. server-only 를 넣지 않는다.
// 원본: design/proposals/grey/g3-minimal-index.html 의 G3K(grey-g3-spec §5.5).
// (2,3) 토러스 매듭의 튜브 위 점들. 링마다 황금비로 위상을 엇갈려 철망이 아니라 점묘로 보인다.

export type KnotMode = "knot" | "scatter";

export const KNOT_SPIN = 0.2;
export const KNOT_TILT = 0.3;
export const KNOT_VIEWBOX = 168;

const GOLD = 0.6180339887;
const TUBE = 0.3;
const DEPTH = 3.4;

type Vec3 = [number, number, number];

const norm3 = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// FNV-1a 32비트
export const hashSeed = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const curve = (t: number): Vec3 => {
  const rr = 2 + Math.cos(3 * t);
  return [rr * Math.cos(2 * t), rr * Math.sin(2 * t), -Math.sin(3 * t) * 1.2];
};

// [x, y, z, nx, ny, nz]* . scatter 는 매듭이 흩어진 모양(404).
export const buildKnot = (
  rings: number,
  perRing: number,
  mode: KnotMode,
  seed: number,
): Float32Array => {
  const scatter = mode === "scatter";
  const K = scatter ? 4.1 : 3.3;
  const pts = new Float32Array(rings * perRing * 6);
  const rnd = mulberry32(seed || 19);
  const every = Math.round(rings / 14);
  let off: Vec3 = [0, 0, 0];
  let prevN: Vec3 | null = null;
  let k = 0;

  for (let i = 0; i < rings; i++) {
    const t = (i / rings) * Math.PI * 2;
    const e = 1e-3;
    const p0 = curve(t);
    const pa = curve(t + e);
    const pb = curve(t - e);
    const T = norm3([pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]]);
    // 평행 이동 프레임(안쪽 교차점에서 Frenet 프레임처럼 뒤집히지 않는다)
    const s0: Vec3 = prevN ?? [0, 0, 1];
    const d = s0[0] * T[0] + s0[1] * T[1] + s0[2] * T[2];
    const Nn = norm3([s0[0] - T[0] * d, s0[1] - T[1] * d, s0[2] - T[2] * d]);
    prevN = Nn;
    const Bv: Vec3 = [
      T[1] * Nn[2] - T[2] * Nn[1],
      T[2] * Nn[0] - T[0] * Nn[2],
      T[0] * Nn[1] - T[1] * Nn[0],
    ];
    if (scatter && i % every === 0) {
      off =
        rnd() < 0.75
          ? [(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, (rnd() - 0.5) * 1.2]
          : [0, 0, 0];
    }
    for (let j = 0; j < perRing; j++) {
      const ph = ((j + i * GOLD) / perRing) * Math.PI * 2;
      const c = Math.cos(ph);
      const s = Math.sin(ph);
      const nx = Nn[0] * c + Bv[0] * s;
      const ny = Nn[1] * c + Bv[1] * s;
      const nz = Nn[2] * c + Bv[2] * s;
      let jx = 0;
      let jy = 0;
      let jz = 0;
      if (scatter) {
        const f = 0.55 + rnd() * 0.6;
        jx = off[0] * f;
        jy = off[1] * f;
        jz = off[2] * f;
      }
      pts[k++] = (p0[0] + nx * TUBE + jx) / K;
      pts[k++] = (p0[1] + ny * TUBE + jy) / K;
      pts[k++] = (p0[2] + nz * TUBE + jz) / K;
      pts[k++] = nx;
      pts[k++] = ny;
      pts[k++] = nz;
    }
  }
  return pts;
};

const LIGHT = norm3([-0.4, -0.65, -0.65]);

// size × size 상자에 투영한다. 결과 [px, py, a]*, a(0..1) = 깊이 감쇠 × 부드러운 램버트.
export const projectKnot = (
  pts: Float32Array,
  size: number,
  spin: number,
  tilt: number,
  out?: Float32Array,
): Float32Array => {
  const n = pts.length / 6;
  const scale = size * 0.43;
  const c0 = size / 2;
  const res = out && out.length === n * 3 ? out : new Float32Array(n * 3);
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  const cp = Math.cos(tilt);
  const sp = Math.sin(tilt);

  for (let q = 0, o = 0; q < pts.length; q += 6, o += 3) {
    const x = pts[q];
    const y = pts[q + 1];
    const z = pts[q + 2];
    const x1 = x * cs - y * ss;
    const y1 = x * ss + y * cs;
    const y2 = y1 * cp - z * sp;
    const z2 = y1 * sp + z * cp;
    const f = DEPTH / (DEPTH + z2);
    const nx = pts[q + 3];
    const ny = pts[q + 4];
    const nz = pts[q + 5];
    const nx1 = nx * cs - ny * ss;
    const ny1 = nx * ss + ny * cs;
    const ny2 = ny1 * cp - nz * sp;
    const nz2 = ny1 * sp + nz * cp;
    const near = Math.min(1, Math.max(0, (0.8 - z2) / 1.6)); // 1 = 가장 가까움
    const lam = Math.max(0, nx1 * LIGHT[0] + ny2 * LIGHT[1] + nz2 * LIGHT[2]);
    const face = nz2 > 0.3 ? 0.6 : 1; // 튜브 뒷면은 물러난다
    res[o] = c0 + x1 * f * scale;
    res[o + 1] = c0 + y2 * f * scale;
    res[o + 2] = (0.28 + 0.72 * near) * (0.55 + 0.45 * lam) * face;
  }
  return res;
};

export interface KnotSvgLayer {
  opacity: number;
  width: number;
  d: string;
}

const LAYERS = 8;
const round2 = (n: number) => Math.round(n * 100) / 100;
const svgCache = new Map<string, KnotSvgLayer[]>();

// 서버 렌더 SVG(JS 없을 때의 최종 이미지, 캔버스가 뜨기 전 첫 화면). 같은 입력 → 같은 출력.
// 점을 불투명도 8단계 레이어로 나눠 레이어마다 path 하나(점 = 길이 0 선분 + round cap).
export const knotSvgLayers = (mode: KnotMode, seed: string): KnotSvgLayer[] => {
  const key = `${mode}:${seed}`;
  const cached = svgCache.get(key);
  if (cached) return cached;

  const proj = projectKnot(
    buildKnot(150, 6, mode, hashSeed(seed)),
    KNOT_VIEWBOX,
    KNOT_SPIN,
    KNOT_TILT,
  );
  const buckets: string[][] = Array.from({ length: LAYERS }, () => []);
  for (let o = 0; o < proj.length; o += 3) {
    const b = Math.min(LAYERS - 1, Math.floor(proj[o + 2] * LAYERS));
    buckets[b].push(`M${proj[o].toFixed(1)} ${proj[o + 1].toFixed(1)}h0`);
  }
  const layers = buckets.flatMap((paths, b) =>
    paths.length
      ? [
          {
            opacity: round2((b + 1) / LAYERS),
            width: round2(1 + (0.5 * b) / (LAYERS - 1)),
            d: paths.join(""),
          },
        ]
      : [],
  );
  svgCache.set(key, layers);
  return layers;
};
