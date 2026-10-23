import localFont from "next/font/local";
import { IBM_Plex_Mono, Noto_Serif_KR } from "next/font/google";

// 본문, UI: Pretendard 가변 폰트 1개(src/fonts, pretendard@1.3.9, OFL)
export const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  weight: "45 920",
  style: "normal",
  display: "swap",
  variable: "--font-pretendard",
  preload: true,
});

// 세리프는 h1, h2, 홈 hero 문장, blockquote 에만 쓴다. 한글 글리프는 Google CSS 의 unicode-range 슬라이스로 필요한 것만 받는다.
export const notoSerifKr = Noto_Serif_KR({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-serif-kr",
});

export const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-plex-mono",
});
