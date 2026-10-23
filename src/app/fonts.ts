import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";

// 글꼴은 sans 하나(Pretendard)와 메타/코드용 mono(IBM Plex Mono) 뿐이다(세리프 없음).
// 본문, UI: Pretendard 가변 폰트 1개(src/fonts, pretendard@1.3.9, OFL). 공식 subset_glyphs.txt
// 기준 서브셋(KS X 1001 한글 2,350자 포함)이라 범위 밖 글자는 시스템 폰트로 그려진다(frontend.md).
export const pretendard = localFont({
  src: "../fonts/PretendardVariable.subset.woff2",
  weight: "45 920",
  style: "normal",
  display: "swap",
  variable: "--font-pretendard",
  preload: true,
});

export const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-plex-mono",
});
