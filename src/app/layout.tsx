import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import Script from "next/script";
import Header from "@/components/layouts/header";
import Footer from "@/components/layouts/footer";
import { plexMono, pretendard } from "@/app/fonts";
import { analytics, site } from "@/lib/config";
import { alternates, openGraph } from "@/lib/metadata";
import { THEME_COLORS, THEME_STORAGE_KEY } from "@/lib/theme";

// 첫 페인트 전에 저장된 테마(data-theme)와 JS 사용 여부(data-js)를 <html> 에 붙인다.
// system 이면 속성 없이 CSS 미디어쿼리가 처리한다.
const THEME_INIT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}})()`;

// GA 는 id 가 있을 때만 넣는다. id 는 JSON 문자열로 넣어 인라인 스크립트를 깨지 않게 한다.
const GA_INIT = (gaId: string) => `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaId)});`;

// GA 측정 ID(빌드 때 인라인되는 NEXT_PUBLIC_ 값). 없으면(예: 로컬) gtag 를 넣지 않는다.
const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      "naver-site-verification": "802885b1ae64198e719ba1a0a3f60119c65302e1",
    },
  },
  // canonical 은 페이지마다 둔다(여기 두면 404 같은 페이지도 물려받는다).
  alternates: alternates(),
  // 자기 openGraph 가 없는 페이지의 기본값. og:image 는 app/opengraph-image.tsx,
  // twitter 의 제목, 설명, 이미지는 Next 가 openGraph 에서 채운다.
  openGraph: openGraph("/", site.title, site.description, { ownImage: true }),
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={site.locale}
      suppressHydrationWarning
      className={`${pretendard.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-box focus:bg-text focus:px-4 focus:py-2 focus:text-bg"
        >
          본문으로 건너뛰기
        </a>
        <Header />
        <main id="main" className="site-main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
      {analytics.gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analytics.gaId)}`}
          />
          <Script id="gtag">{GA_INIT(analytics.gaId)}</Script>
        </>
      )}
    </html>
  );
}
