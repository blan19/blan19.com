import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// 한글을 지원하는 번들 폰트. satori 는 woff 를 읽고 woff2 는 못 읽는다.
// 경로는 process.cwd() 기준이라 파일을 옮기면 Vercel 파일 트레이싱도 확인한다(.claude/rules/tooling.md).
const pretendardBold = readFile(join(process.cwd(), "src/app/og/Pretendard-Bold.woff"));

const DEFAULT_TITLE = "blan19 · 프론트엔드 엔지니어의 기록";
const MAX_TITLE_CHARS = 70;
const FONT_TIMEOUT_MS = 2500;
const SERIF_CACHE_LIMIT = 100;
const TITLE_LINE_HEIGHT = 135; // 104px × 1.3

// 세리프 제목 폰트는 요청한 글자만 Google Fonts 에서 받아 모듈 메모리에 둔다(가장 오래된 것부터 지움).
const serifCache = new Map<string, ArrayBuffer>();

const loadSerif = async (text: string): Promise<ArrayBuffer | undefined> => {
  const cached = serifCache.get(text);
  if (cached) return cached;

  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl, { signal: AbortSignal.timeout(FONT_TIMEOUT_MS) })).text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return undefined;

    const res = await fetch(match[1], { signal: AbortSignal.timeout(FONT_TIMEOUT_MS) });
    if (!res.ok) return undefined;
    const data = await res.arrayBuffer();

    if (serifCache.size >= SERIF_CACHE_LIMIT) {
      const oldest = serifCache.keys().next().value;
      if (oldest !== undefined) serifCache.delete(oldest);
    }
    serifCache.set(text, data);
    return data;
  } catch {
    // 네트워크가 없거나 느리면 세리프 없이 Pretendard 로 그린다.
    return undefined;
  }
};

const toDisplayTitle = (raw: string | null) => {
  const title = raw?.trim();
  if (!title) return DEFAULT_TITLE;
  const chars = Array.from(title);
  return chars.length > MAX_TITLE_CHARS ? `${chars.slice(0, MAX_TITLE_CHARS).join("")}…` : title;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = toDisplayTitle(searchParams.get("title"));
  const [serif, pretendard] = await Promise.all([loadSerif(`${title}blan19`), pretendardBold]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "120px 160px",
          background: "#FBF8F3",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              width: 112,
              height: 112,
              padding: 6,
              borderRadius: 10,
              background: "#1D6B57",
              transform: "rotate(-4deg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                border: "2px solid #FFFFFF8C",
                borderRadius: 6,
                color: "#FFFFFF",
                fontSize: 52,
                fontWeight: 700,
              }}
            >
              19
            </div>
          </div>
          <div
            style={{
              display: "flex",
              color: "#1E1B17",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            blan19
          </div>
        </div>
        {/* 단어 단위 flex-wrap: 공백에서만 줄을 바꾼다(satori 의 keep-all 은 "(RSC)" 의 괄호 앞에서도 끊는다). 최대 3줄. */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 28,
            maxHeight: TITLE_LINE_HEIGHT * 3,
            overflow: "hidden",
            color: "#1E1B17",
            fontFamily: "Serif, Pretendard",
            fontSize: 104,
            fontWeight: 700,
            lineHeight: `${TITLE_LINE_HEIGHT}px`,
            letterSpacing: "-0.01em",
          }}
        >
          {title.split(/\s+/).map((word, index) => (
            <span key={index} style={{ whiteSpace: "nowrap" }}>
              {word}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              height: 10,
              borderTop: "2px solid #D3CABB",
              borderBottom: "2px solid #D3CABB",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 28,
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#6F685D" }}>www.blan19.xyz</span>
            <span style={{ color: "#1D6B57" }}>tech</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1920,
      height: 1080,
      fonts: [
        ...(serif ? [{ name: "Serif", data: serif, weight: 700 as const, style: "normal" as const }] : []),
        { name: "Pretendard", data: pretendard, weight: 700, style: "normal" },
      ],
      // Next 15부터 ImageResponse 기본값이 max-age=0으로 바뀌어 기존 1년 캐시 헤더를 직접 지정한다.
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
