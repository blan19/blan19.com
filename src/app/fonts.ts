import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";

// 글꼴은 sans 하나(Pretendard)와 메타/코드용 mono(IBM Plex Mono) 뿐이다(세리프 없음).
// 본문, UI: Pretendard 가변 폰트 1개(src/fonts, pretendard@1.3.9, OFL)
export const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
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
