import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Next 14(@vercel/og 0.5)의 기본 글꼴과 같은 파일·설정을 직접 지정해 기존 OG 이미지 모양을 유지한다.
const fontData = readFile(
  join(process.cwd(), "src/app/og/noto-sans-v27-latin-regular.ttf")
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postTitle = searchParams.get("title");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            marginLeft: 190,
            marginRight: 190,
            display: "flex",
            fontSize: 130,
            letterSpacing: "-0.05em",
            fontStyle: "normal",
            color: "white",
            // 기존 렌더러(@vercel/og 0.5)는 "120px"를 약 136.5px 간격으로 그렸다. 새 렌더러는 지정값을 그대로 지키므로 기존 줄 간격에 맞춘다.
            lineHeight: "136px",
            whiteSpace: "pre-wrap",
          }}
        >
          {postTitle}
        </div>
      </div>
    ),
    {
      width: 1920,
      height: 1080,
      fonts: [
        {
          name: "sans serif",
          data: await fontData,
          weight: 700,
          style: "normal",
        },
      ],
      // Next 15부터 ImageResponse 기본값이 max-age=0으로 바뀌어 기존 1년 캐시 헤더를 직접 지정한다.
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    }
  );
}
