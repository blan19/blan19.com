// 홈/404 의 점묘 노트북(hero object) 기하. DOM 없는 순수 함수라 서버(SVG 대체 이미지)와
// 클라이언트 섬(ui/hero-canvas)이 같이 쓴다. server-only 를 넣지 않는다.
// 맥북 비슷한 노트북: 쐐기형 하판(윗면 모서리, 바닥 모서리, 자판, 트랙패드)과 열린 덮개(테두리, 화면 점 격자,
// 재생 글리프, 재생 막대). 화면 안에서는 재생 글리프와 막대만 밝고 점 격자는 질감이다.
// 윤곽(하판 윗면, 덮개 테두리)은 0.95 로 형태를 잡는다.
// 같은 (mode, seed) 는 같은 모양이다(난수는 시드 고정 mulberry32, Math.random 없음).

export type LaptopMode = "laptop" | "scatter";

// 점 레코드(stride 8): [x, y, z, nx, ny, nz, w, tag]
//   월드 좌표: y 위, z 보는 쪽, 하판 바닥 y = 0, 바닥 면 중심이 원점
//   w   = 기본 세기 0..1
//   tag = -1 일반 | 0..1 재생 막대 점(막대 위 위치 u) | 2 재생 헤드(진행률만큼 막대를 따라 민다)
const STRIDE = 8;

// 서버 SVG 와 캔버스가 같은 좌표계(3:2)를 쓰므로 교차 때 모양이 튀지 않는다.
export const LAPTOP_VIEW_W = 360;
export const LAPTOP_VIEW_H = 240;

// 자세: t = 0 의 정지 프레임(서버 SVG, 첫 캔버스 프레임, reduced motion)은 모두 이 값이다.
export const LAPTOP_PITCH = 0.42; // 카메라가 약 24° 내려다본다
export const LAPTOP_YAW0 = -0.42; // 화면이 왼쪽(소개 글) 쪽으로 돈 3/4 자세
export const LAPTOP_PROGRESS0 = 0.38;
const SWAY_A = 0.16; // 흔들림 진폭(rad)
const SWAY_T = 46; // 흔들림 한 주기(초)
const SCRUB_T = 72; // 재생 막대 한 바퀴(초)
const SCRUB_FADE = 1.2; // 진행률이 1 → 0 으로 돌 때 지난 구간이 흐려지는 시간(초)

// 입력 범위(캔버스). 맞춤(fit)은 흔들림 + 시차 범위를 기준으로 하고, 드래그는 그 밖으로 조금 나갈 수 있다.
export const LAPTOP_PARALLAX_YAW = 0.07;
export const LAPTOP_PARALLAX_PITCH = 0.05;
export const LAPTOP_DRAG_YAW = 0.35; // 드래그로 더하는 yaw 의 최대 절댓값
export const LAPTOP_DRAG_PITCH = 0.12; // pitch 는 LAPTOP_PITCH ± 이 값(덮개 뒷면이 보이지 않게)

// 불투명도 양자화(서버 SVG 의 path 수 = 캔버스의 fill 수)
export const LAPTOP_BUCKETS = 12;
const MIN_ALPHA = 0.04; // 이하인 점은 그리지도, 맞춤에 넣지도 않는다

const W = 1.4; // 하판 너비
const D = 0.98; // 하판 깊이
const T_FRONT = 0.026; // 쐐기: 앞이 얇고
const T_BACK = 0.05; // 뒤가 두껍다
const R_BASE = 0.075;
const L = 0.94; // 덮개 길이
const R_LID = 0.06;
const OPEN = (112 * Math.PI) / 180; // 닫힌 상태에서 연 각도
const DEPTH = 4.2; // 원근 거리
const MID_Y = 0.4; // 회전 중심 높이
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

type Vec3 = [number, number, number];

const norm3 = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

const LIGHT = norm3([-0.45, 0.7, 0.55]);

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

const topY = (z: number) => T_BACK + ((T_FRONT - T_BACK) * (z + D / 2)) / D;

type Edge = [number, number, number, number]; // [u, v, 바깥u, 바깥v]

// 둥근 사각형 둘레를 호 길이로 고르게 나눈다.
const roundRect = (
  w: number,
  h: number,
  r: number,
  step: number,
  cx = 0,
  cy = 0,
): Edge[] => {
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  const arc = (ox: number, oy: number, a0: number, da: number): Edge => {
    const a = a0 + da;
    return [ox + r * Math.cos(a), oy + r * Math.sin(a), Math.cos(a), Math.sin(a)];
  };
  const q = (Math.PI / 2) * r;
  const segs: { len: number; at: (s: number) => Edge }[] = [
    { len: 2 * hh, at: (s) => [cx + w / 2, cy - hh + s, 1, 0] },
    { len: q, at: (s) => arc(cx + hw, cy + hh, 0, s / r) },
    { len: 2 * hw, at: (s) => [cx + hw - s, cy + h / 2, 0, 1] },
    { len: q, at: (s) => arc(cx - hw, cy + hh, Math.PI / 2, s / r) },
    { len: 2 * hh, at: (s) => [cx - w / 2, cy + hh - s, -1, 0] },
    { len: q, at: (s) => arc(cx - hw, cy - hh, Math.PI, s / r) },
    { len: 2 * hw, at: (s) => [cx - hw + s, cy - h / 2, 0, -1] },
    { len: q, at: (s) => arc(cx + hw, cy - hh, 1.5 * Math.PI, s / r) },
  ];
  const total = segs.reduce((s, g) => s + g.len, 0);
  const n = Math.max(8, Math.round(total / step));
  const out: Edge[] = [];
  let si = 0;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / n) * total;
    while (si < segs.length - 1 && s > acc + segs[si].len) {
      acc += segs[si].len;
      si++;
    }
    out.push(segs[si].at(Math.min(segs[si].len, s - acc)));
  }
  return out;
};

// 자판 배치(키 단위, 줄마다 합 14.5u)
const KEY_ROWS: { h: number; keys: (number | "arrows")[] }[] = [
  { h: 0.55, keys: Array<number>(14).fill(14.5 / 14) },
  { h: 1, keys: [...Array<number>(13).fill(1), 1.5] },
  { h: 1, keys: [1.5, ...Array<number>(13).fill(1)] },
  { h: 1, keys: [1.8, ...Array<number>(11).fill(1), 1.7] },
  { h: 1, keys: [2.35, ...Array<number>(10).fill(1), 2.15] },
  { h: 1, keys: [1, 1, 1, 1.25, 5, 1.25, 1, "arrows"] },
];

// 화면 영역(덮개 평면 좌표: x 가로, v 경첩에서 위로)
const DX0 = -W / 2 + 0.05;
const DX1 = W / 2 - 0.05;
const DV0 = 0.075;
const DV1 = L - 0.045;
const BAR_X0 = DX0 + 0.06;
const BAR_X1 = DX1 - 0.06;
const BAR_LEN = BAR_X1 - BAR_X0;
const BAR_V = DV0 + 0.075;

export const buildLaptop = (mode: LaptopMode, seed: number): Float32Array => {
  const scatter = mode === "scatter";
  const rnd = mulberry32(seed || 19);
  const P: number[] = [];
  let off: Vec3 = [0, 0, 0];
  const push = (x: number, y: number, z: number, n: Vec3, w: number, tag = -1) => {
    P.push(x + off[0], y + off[1], z + off[2], n[0], n[1], n[2], w, tag);
  };

  // 하판 윗면 모서리(앞 가운데 엄지 홈)
  for (const [x, z0, ou, ov] of roundRect(W, D, R_BASE, 0.017)) {
    let z = z0;
    if (ov > 0.9 && Math.abs(x) < 0.12) {
      z -= 0.022 * Math.cos((x / 0.12) * (Math.PI / 2)) ** 2;
    }
    push(x, topY(z) + 0.002, z, norm3([ou * 0.5, 1, ov * 0.5]), 0.95);
  }
  // 하판 바닥 모서리: 한 줄의 흐린 선(카메라 쪽을 향한 곳만 보인다)
  for (const [x, z, ou, ov] of roundRect(W - 0.02, D - 0.02, R_BASE - 0.01, 0.024)) {
    push(x, 0, z, norm3([ou, 0.25, ov]), 0.4);
  }

  // 자판: 질감으로만 읽히게 흐리고 성기게(1u 키 = 점 2×1)
  const u = 1.17 / 14.5;
  const gap = 0.016;
  let zRow = -D / 2 + 0.085;
  const keyOff = (): Vec3 => {
    if (!scatter) return [0, 0, 0];
    if (rnd() < 0.05) return [(rnd() - 0.5) * 0.9, 0.22 + rnd() * 0.3, (rnd() - 0.2) * 0.5];
    return [(rnd() - 0.5) * 0.05, 0.13 + rnd() * 0.1, (rnd() - 0.5) * 0.05];
  };
  const keyDots = (x0: number, z0: number, kw: number, kd: number) => {
    const nx = Math.max(1, Math.round(kw / 0.032));
    off = keyOff();
    for (let a = 0; a < nx; a++) {
      const x = x0 + ((a + 0.5) / nx) * kw;
      const z = z0 + kd / 2;
      push(x, topY(z) + 0.006, z, [0, 1, 0], 0.55);
    }
  };
  for (const row of KEY_ROWS) {
    const rd = row.h * u;
    let x = -7.25 * u;
    for (const k of row.keys) {
      if (k === "arrows") {
        const kw = u - gap;
        const half = (rd - gap) / 2 - 0.004;
        const lower = zRow + gap / 2 + half + 0.008;
        keyDots(x + gap / 2, lower, kw, half);
        keyDots(x + u + gap / 2, zRow + gap / 2, kw, half);
        keyDots(x + u + gap / 2, lower, kw, half);
        keyDots(x + 2 * u + gap / 2, lower, kw, half);
        x += 3 * u;
        continue;
      }
      keyDots(x + gap / 2, zRow + gap / 2, k * u - gap, rd - gap);
      x += k * u;
    }
    zRow += rd;
  }

  // 트랙패드 테두리
  off = scatter ? [0.08, 0.07, 0.1] : [0, 0, 0];
  const tpZ = (zRow + D / 2 - 0.075) / 2 + 0.01;
  const tpD = D / 2 - 0.075 - zRow - 0.05;
  for (const [x, z] of roundRect(0.58, tpD, 0.03, 0.019, 0, tpZ)) {
    push(x, topY(z) + 0.003, z, [0, 1, 0], 0.7);
  }

  // 덮개
  const a2 = scatter ? (100 * Math.PI) / 180 : OPEN;
  const lc = Math.cos(a2);
  const ls = Math.sin(a2);
  const lidOff: Vec3 = scatter ? [-0.05, 0.46, -0.3] : [0, 0, 0];
  const hingeY = T_BACK;
  const hingeZ = -D / 2 + 0.02;
  const nS: Vec3 = [0, -lc, ls]; // 화면 법선(앞 위)
  const lidP = (lx: number, lv: number, lift = 0): Vec3 => [
    lx,
    hingeY + lv * ls + nS[1] * lift,
    hingeZ + lv * lc + nS[2] * lift,
  ];
  off = lidOff;
  for (const [x, v0, ou, ov] of roundRect(W - 0.004, L, R_LID, 0.017, 0, L / 2)) {
    const p = lidP(x, Math.max(0.006, v0));
    const n = norm3([ou * 0.55, ov * 0.55 * ls + nS[1], ov * 0.55 * lc + nS[2]]);
    push(p[0], p[1], p[2], n, 0.95);
  }

  // 화면: 흐린 점 격자(0.30–0.45), 재생 글리프, 재생 막대
  const COLS = 32;
  const ROWS = 20;
  const dW = DX1 - DX0;
  const dH = DV1 - DV0;
  const pcx = 0;
  const pcv = DV0 + dH * 0.56;
  const lift = scatter ? 0.1 : 0.003;
  const pix = (x: number, v: number, w: number, tag = -1, extra = 0) => {
    const p = lidP(x, v, lift + extra);
    push(p[0], p[1], p[2], nS, w, tag);
  };
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      const x = DX0 + ((i + 0.5) / COLS) * dW;
      const v = DV0 + ((j + 0.5) / ROWS) * dH;
      if (v < BAR_V + 0.035) continue; // 막대 아래 조작부는 비운다
      if (Math.hypot(x - pcx, v - pcv) < 0.216) continue; // 재생 글리프 둘레 여백
      const r = Math.hypot((x - pcx) / (dW / 2), (v - (DV0 + dH * 0.6)) / (dH / 2));
      const w = 0.45 - 0.15 * Math.min(1, r);
      if (scatter) {
        // 오른쪽 위 모서리의 화소가 떨어져 나와 옆으로 흩날린다(상자 안에 머무를 만큼만)
        const k = Math.max(0, (x - DX0) / dW + (v - DV0) / dH - 1.05);
        if (k > 0 && rnd() < 0.85) {
          off = [
            lidOff[0] + (0.1 + rnd() * 0.4) * k * 1.2,
            lidOff[1] + (rnd() - 0.3) * 0.35 * k,
            lidOff[2] + (0.05 + rnd() * 0.35) * k,
          ];
          pix(x, v, w + 0.12);
          off = lidOff;
          continue;
        }
      }
      pix(x, v, w);
    }
  }

  // 재생 글리프(오른쪽을 가리키는 삼각형): 테두리 + 점묘 채움
  const tH = 0.24;
  const tW = 0.216;
  const tri: [number, number][] = [
    [pcx - tW * 0.4, pcv + tH / 2],
    [pcx - tW * 0.4, pcv - tH / 2],
    [pcx + tW * 0.6, pcv],
  ];
  const triLift = scatter ? 0.32 : 0;
  off = scatter ? [lidOff[0] + 0.05, lidOff[1] - 0.02, lidOff[2]] : lidOff;
  for (let e = 0; e < 3; e++) {
    const a = tri[e];
    const b = tri[(e + 1) % 3];
    const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.012);
    for (let q = 0; q < n; q++) {
      const t = q / n;
      pix(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 1, -1, triLift);
    }
  }
  // 채움: 삼각형 안쪽(테두리에서 조금 띄운) 육각 격자. 빗금처럼 줄지어 보이지 않는다.
  const FILL_STEP = 0.019;
  const INSET = 0.017;
  const rowH = FILL_STEP * (Math.sqrt(3) / 2);
  const xl = pcx - tW * 0.4;
  for (let r = 0, v = pcv - tH / 2 + INSET; v <= pcv + tH / 2 - INSET; r++, v += rowH) {
    const xr = pcx + tW * 0.6 - (Math.abs(v - pcv) / (tH / 2)) * tW; // 오른쪽 빗변
    for (let x = xl + INSET + (r % 2) * (FILL_STEP / 2); x <= xr - INSET * 1.6; x += FILL_STEP) {
      pix(x, v, 0.85, -1, triLift);
    }
  }

  // 재생 막대(tag = u). 404 는 막대가 몇 조각으로 끊겨 떠다닌다.
  const nb = Math.round(BAR_LEN / 0.011);
  for (let q = 0; q <= nb; q++) {
    const t = q / nb;
    const x = BAR_X0 + BAR_LEN * t;
    if (scatter) {
      const sr = mulberry32((seed || 19) + Math.floor(t * 5) * 977);
      off = [
        lidOff[0] + (sr() - 0.5) * 0.12,
        lidOff[1] - sr() * 0.12,
        lidOff[2] + 0.08 + sr() * 0.25,
      ];
      pix(x, BAR_V + (sr() - 0.5) * 0.04, t < LAPTOP_PROGRESS0 ? 1 : 0.35);
      continue;
    }
    pix(x, BAR_V, 1, t);
  }
  off = lidOff;
  // 재생 헤드: 작은 해바라기 원판(막대 시작점 기준, 투영 때 진행률만큼 민다)
  if (!scatter) {
    const HEAD = 20;
    const R = 0.016;
    for (let q = 0; q < HEAD; q++) {
      const r = R * Math.sqrt((q + 0.5) / HEAD);
      const a = q * GOLDEN_ANGLE;
      pix(BAR_X0 + r * Math.cos(a), BAR_V + r * Math.sin(a), 1, 2, 0.001);
    }
  }
  // 카메라 점
  {
    const p = lidP(0, L - 0.022, 0.002);
    push(p[0], p[1], p[2], nS, 0.6);
  }

  return new Float32Array(P);
};

export const laptopDotCount = (pts: Float32Array) => pts.length / STRIDE;

export interface LaptopFit {
  s: number;
  cx: number;
  cy: number;
  // 맞춤 범위 전체(합집합)의 잉크와 여백 사이 빈 폭(상자 너비 대비 비율). 높이로 맞춰져 남는 가로 폭이다.
  // CSS 가 상자를 이만큼 옮겨 잉크를 본문 열 끝이나 글 왼쪽 끝에 맞춘다(ui/hero-object 의 --obj-slack-l/r).
  slackL: number;
  slackR: number;
}

// 투영에 필요한 맞춤 값(배율과 중심). 캔버스는 이것만 받아 상자 크기에 맞게 늘린다.
export type LaptopScale = Pick<LaptopFit, "s" | "cx" | "cy">;

// fit 좌표계로 투영한다. 결과 [px, py, a]*, a(0..1) = 기본 세기 × 깊이 × 램버트 × 면 방향.
// progress(0..1) 는 재생 막대 위치, fade(0..1) 는 진행률이 막 1 → 0 으로 돈 뒤 지난 구간의 남은 밝기.
export const projectLaptop = (
  pts: Float32Array,
  fit: LaptopScale,
  yaw: number,
  pitch: number,
  progress: number,
  fade = 0,
  out?: Float32Array,
): Float32Array => {
  const n = pts.length / STRIDE;
  const res = out && out.length === n * 3 ? out : new Float32Array(n * 3);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const headDx = progress * BAR_LEN;
  const unplayed = 0.35 + 0.65 * fade;
  for (let q = 0, o = 0; q < pts.length; q += STRIDE, o += 3) {
    const tag = pts[q + 7];
    const x = tag === 2 ? pts[q] + headDx : pts[q];
    const y = pts[q + 1] - MID_Y;
    const z = pts[q + 2];
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    const f = DEPTH / (DEPTH - z2);
    res[o] = fit.cx + x1 * f * fit.s;
    res[o + 1] = fit.cy - y2 * f * fit.s;

    const nx = pts[q + 3];
    const ny = pts[q + 4];
    const nz = pts[q + 5];
    const nx1 = nx * cy + nz * sy;
    const nz1 = -nx * sy + nz * cy;
    const ny2 = ny * cp - nz1 * sp;
    const nz2 = ny * sp + nz1 * cp;
    // 카메라에서 돌아선 면은 흐려진다(먼 쪽 바닥 모서리를 숨긴다)
    const face = Math.min(1, Math.max(0, (nz2 + 0.08) / 0.3));
    const lam = Math.max(0, nx1 * LIGHT[0] + ny2 * LIGHT[1] + nz2 * LIGHT[2]);
    const near = Math.min(1, Math.max(0, (z2 + 0.9) / 1.6));
    let w = pts[q + 6];
    if (tag >= 0 && tag <= 1) w = tag <= progress ? 1 : unplayed;
    res[o + 2] = w * (0.55 + 0.45 * near) * (0.62 + 0.38 * lam) * face;
  }
  return res;
};

// 흔들림(t 초). t = 0 이면 LAPTOP_YAW0.
export const laptopYawAt = (t: number) =>
  LAPTOP_YAW0 + SWAY_A * Math.sin((2 * Math.PI * t) / SWAY_T);

// 재생 막대(t 초). 한 바퀴를 돌면 지난 구간을 SCRUB_FADE 초 동안 흐리며 처음부터 다시 채운다.
export const laptopScrubAt = (t: number): { progress: number; fade: number } => {
  const raw = LAPTOP_PROGRESS0 + t / SCRUB_T;
  const progress = raw - Math.floor(raw);
  const since = progress * SCRUB_T; // 마지막으로 돈 뒤 지난 시간(초)
  const fade = raw >= 1 ? Math.max(0, 1 - since / SCRUB_FADE) : 0;
  return { progress, fade };
};

// 모드별 정지 자세(서버 SVG, 첫 캔버스 프레임)
export const laptopPose = (mode: LaptopMode) =>
  mode === "scatter"
    ? { yaw: LAPTOP_YAW0 - 0.06, pitch: LAPTOP_PITCH + 0.06 }
    : { yaw: LAPTOP_YAW0, pitch: LAPTOP_PITCH };

// LAPTOP_VIEW_W × LAPTOP_VIEW_H 상자에 맞춘다. 홈은 흔들림 + 시차 범위 전체의 합집합 경계로 맞춰
// 움직이는 동안 크기가 변하지 않는다. 여백은 상자 기준(좌우 2% 너비, 위 2% 높이, 아래 2), 가운데 정렬.
export const laptopFit = (mode: LaptopMode, pts: Float32Array): LaptopFit => {
  const w = LAPTOP_VIEW_W;
  const h = LAPTOP_VIEW_H;
  const pose = laptopPose(mode);
  const yaws: number[] = [];
  const pitches: number[] = [];
  if (mode === "scatter") {
    yaws.push(pose.yaw);
    pitches.push(pose.pitch);
  } else {
    const y0 = LAPTOP_YAW0 - SWAY_A - LAPTOP_PARALLAX_YAW;
    const y1 = LAPTOP_YAW0 + SWAY_A + LAPTOP_PARALLAX_YAW;
    for (let k = 0; k <= 8; k++) yaws.push(y0 + ((y1 - y0) * k) / 8);
    for (let k = -1; k <= 1; k++) pitches.push(LAPTOP_PITCH + k * LAPTOP_PARALLAX_PITCH);
  }
  let minx = Infinity;
  let maxx = -Infinity;
  let miny = Infinity;
  let maxy = -Infinity;
  const unit = { s: 1, cx: 0, cy: 0 };
  let p: Float32Array | undefined;
  for (const yaw of yaws) {
    for (const pitch of pitches) {
      for (const prog of [0, 1]) {
        p = projectLaptop(pts, unit, yaw, pitch, prog, 0, p);
        for (let o = 0; o < p.length; o += 3) {
          if (p[o + 2] <= MIN_ALPHA) continue;
          if (p[o] < minx) minx = p[o];
          if (p[o] > maxx) maxx = p[o];
          if (p[o + 1] < miny) miny = p[o + 1];
          if (p[o + 1] > maxy) maxy = p[o + 1];
        }
      }
    }
  }
  const pad = { l: w * 0.02, r: w * 0.02, t: h * 0.02, b: 2 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const s = Math.min(iw / (maxx - minx), ih / (maxy - miny));
  const cx = pad.l + iw / 2 - ((minx + maxx) / 2) * s;
  return {
    s,
    cx,
    cy: pad.t + ih / 2 - ((miny + maxy) / 2) * s,
    slackL: Math.max(0, cx + minx * s - pad.l) / w,
    slackR: Math.max(0, w - pad.r - (cx + maxx * s)) / w,
  };
};

// 불투명도 → 양자화 칸. 칸 < 0 이면 그리지 않는다. 서버 SVG 와 캔버스가 같은 칸, 같은 크기를 쓴다.
export const laptopBucket = (a: number) =>
  a <= MIN_ALPHA ? -1 : Math.min(LAPTOP_BUCKETS - 1, Math.floor(a * LAPTOP_BUCKETS));
export const laptopBucketAlpha = (b: number) => (b + 0.5) / LAPTOP_BUCKETS;
// 점 반지름(viewBox 단위)
export const laptopBucketRadius = (b: number) => 0.6 + 0.55 * laptopBucketAlpha(b);

export interface LaptopSvgLayer {
  opacity: number;
  width: number;
  d: string;
}

export interface LaptopSvg {
  layers: LaptopSvgLayer[];
  slackL: number;
  slackR: number;
  fit: LaptopFit; // 캔버스 섬이 다시 계산하지 않게 그대로 넘긴다(결정적이라 같은 값)
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const svgCache = new Map<string, LaptopSvg>();

// 서버 렌더 SVG(JS 없을 때의 최종 이미지, 캔버스가 뜨기 전 첫 화면). 같은 입력 → 같은 출력.
// 점을 불투명도 칸별 path 하나로 묶는다(점 = 길이 0 선분 + round cap). 캔버스 t = 0 프레임과 같다.
// slackL/R 은 맞춤의 빈 가로 폭(LaptopFit 과 같은 값, 소수 넷째 자리)이다. fit 은 반올림하지 않은 원본이다.
export const laptopSvg = (mode: LaptopMode, seed: string): LaptopSvg => {
  const key = `${mode}:${seed}`;
  const cached = svgCache.get(key);
  if (cached) return cached;

  const pts = buildLaptop(mode, hashSeed(seed));
  const pose = laptopPose(mode);
  const fit = laptopFit(mode, pts);
  const proj = projectLaptop(pts, fit, pose.yaw, pose.pitch, LAPTOP_PROGRESS0);
  const buckets: string[][] = Array.from({ length: LAPTOP_BUCKETS }, () => []);
  for (let o = 0; o < proj.length; o += 3) {
    const b = laptopBucket(proj[o + 2]);
    if (b < 0) continue;
    buckets[b].push(`M${proj[o].toFixed(1)} ${proj[o + 1].toFixed(1)}h0`);
  }
  const layers = buckets.flatMap((paths, b) =>
    paths.length
      ? [
          {
            opacity: round2(laptopBucketAlpha(b)),
            width: round2(2 * laptopBucketRadius(b)),
            d: paths.join(""),
          },
        ]
      : [],
  );
  const svg = {
    layers,
    slackL: Math.round(fit.slackL * 1e4) / 1e4,
    slackR: Math.round(fit.slackR * 1e4) / 1e4,
    fit,
  };
  svgCache.set(key, svg);
  return svg;
};
