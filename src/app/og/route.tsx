import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import config from "@/lib/config";
import { getBlogPosts } from "@/lib/posts";
import { OG_IMAGE_SIZE } from "@/lib/seo";

// 한글을 지원하는 번들 폰트 하나만 쓴다(네트워크 요청 없음). satori 는 woff 를 읽고 woff2 는 못 읽는다.
// 경로는 process.cwd() 기준이라 파일을 옮기면 Vercel 파일 트레이싱도 확인한다(.claude/rules/tooling.md).
const pretendardBold = readFile(join(process.cwd(), "src/app/og/Pretendard-Bold.woff"));

const DEFAULT_TITLE = config.site.name;
const MAX_TITLE_CHARS = 70;
const TITLE_LINE_HEIGHT = 84; // 65px × 1.3

// 색은 globals.css 의 라이트 토큰과 같은 회색(--bg, --text, --line-strong, --text-3)이다.
const BG = "#F8F9FA";
const TEXT = "#212529";
const RULE = "#DEE2E6";
const META = "#666E76";

// 임의 문구가 이 사이트 이미지로 그려지지 않도록 title 이 tech 글 제목이나 사이트 이름과 정확히 같을 때만 그대로 쓴다.
// 그 밖(없음, 임의 문구)은 사이트 이름으로 그린다(상태는 200 그대로). DB 는 쓰지 않는다.
const isKnownTitle = (raw: string) =>
  raw === DEFAULT_TITLE || getBlogPosts("tech").some((post) => post.metadata.title === raw);

const toDisplayTitle = (raw: string | null) => {
  const title = raw !== null && isKnownTitle(raw) ? raw : DEFAULT_TITLE;
  const chars = Array.from(title);
  return chars.length > MAX_TITLE_CHARS ? `${chars.slice(0, MAX_TITLE_CHARS).join("")}…` : title;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = toDisplayTitle(searchParams.get("title"));
  const pretendard = await pretendardBold;

  return new ImageResponse(
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
          blan19
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
            fontSize: 65,
            fontWeight: 700,
            lineHeight: `${TITLE_LINE_HEIGHT}px`,
            letterSpacing: "-0.02em",
          }}
        >
          {title.split(/\s+/).map((word, index) => (
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
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <span style={{ color: META }}>www.blan19.xyz</span>
            <span style={{ color: TEXT }}>tech</span>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [{ name: "Pretendard", data: pretendard, weight: 700, style: "normal" }],
      // Next 15부터 ImageResponse 기본값이 max-age=0으로 바뀌어 기존 1년 캐시 헤더를 직접 지정한다.
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
