import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/config";
import { OG_SIZE } from "@/lib/metadata";

// opengraph-image(사이트 기본, 글마다)가 같이 쓰는 OG 카드. 둘 다 빌드 때 PNG 로 만든다.
// 1200×630(1.91:1, summary_large_image, OG_SIZE). 수치는 이전 1920×1080 판의 0.625배다.

// 한글을 지원하는 번들 폰트 하나만 쓴다(네트워크 요청 없음). satori 는 woff 를 읽고 woff2 는 못 읽는다.
// 요청과 무관한 파일이라 모듈 스코프에서 한 번 읽는다(Next 문서의 OG 예시). 경로는 process.cwd() 기준이라
// 파일을 옮기면 Vercel 파일 트레이싱(.next/server/app/**/opengraph-image*.nft.json)도 확인한다.
const FONTS = [
  {
    name: "Pretendard",
    data: await readFile(join(process.cwd(), "src/fonts/Pretendard-Bold.woff")),
    weight: 700 as const,
    style: "normal" as const,
  },
];

const MAX_TITLE_CHARS = 70;
const TITLE_SIZE = 65;
const TITLE_LINE_HEIGHT = 85; // 65px × 1.3

// 색은 globals.css 의 라이트 토큰과 같은 회색(--bg, --text, --line-strong, --text-3)이다.
const BG = "#F8F9FA";
const TEXT = "#212529";
const RULE = "#DEE2E6";
const META = "#666E76";

const clip = (title: string) => {
  const chars = Array.from(title.trim());
  return chars.length > MAX_TITLE_CHARS ? `${chars.slice(0, MAX_TITLE_CHARS).join("")}…` : chars.join("");
};

// label: 오른쪽 아래 구역 표시(글은 "tech", 사이트 기본은 없음)
export const renderOgImage = (title: string, label?: string) =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "75px 100px",
          background: BG,
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            display: "flex",
            color: TEXT,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {site.name}
        </div>
        {/* 단어 단위 flex-wrap: 공백에서만 줄을 바꾼다(satori 의 keep-all 은 "(RSC)" 의 괄호 앞에서도 끊는다). 최대 3줄. */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 18,
            maxHeight: TITLE_LINE_HEIGHT * 3,
            overflow: "hidden",
            color: TEXT,
            fontSize: TITLE_SIZE,
            fontWeight: 700,
            lineHeight: `${TITLE_LINE_HEIGHT}px`,
            letterSpacing: "-0.02em",
          }}
        >
          {clip(title)
            .split(/\s+/)
            .map((word, index) => (
              <span key={index} style={{ whiteSpace: "nowrap" }}>
                {word}
              </span>
            ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 0, borderTop: `2px solid ${RULE}` }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 18,
              fontSize: 23,
              fontWeight: 700,
            }}
          >
            <span style={{ color: META }}>{site.host}</span>
            {label && <span style={{ color: TEXT }}>{label}</span>}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS },
  );
