import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import Script from "next/script";
import Header from "@/components/layouts/header";
import Footer from "@/components/layouts/footer";
import { plexMono, pretendard } from "@/app/fonts";
import config from "@/lib/config";
import { alternates, openGraph } from "@/lib/seo";
import { THEME_COLORS } from "@/lib/theme";

// 첫 페인트 전에 저장된 테마(data-theme)와 JS 사용 여부(data-js)를 <html> 에 붙인다.
// 저장 키("theme")는 src/lib/theme.ts 의 THEME_STORAGE_KEY 와 같다. system 이면 속성 없이 CSS 미디어쿼리가 처리한다.
const THEME_INIT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}})()`;

// GA 측정 ID(빌드 때 인라인되는 NEXT_PUBLIC_ 값). 없으면(예: 로컬) gtag 를 넣지 않는다.
const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const metadata: Metadata = {
  metadataBase: new URL(config.url),
  title: {
    default: config.site.name,
    template: "%s | blan19",
  },
  description: config.site.description,
  // robots 는 두지 않는다(기본값이 index, follow). 404 는 Next 가 noindex 를 넣는데, 여기서 robots 를 정하면
  // 404 HTML 에 robots 메타가 두 개(서로 다른 값) 나온다.
  verification: {
    other: {
      "naver-site-verification": "802885b1ae64198e719ba1a0a3f60119c65302e1",
    },
  },
  alternates: alternates(),
  // og:url 은 없다(페이지가 path 와 함께 다시 지정한다). 404, error 는 이 기본값을 쓴다.
  openGraph: openGraph({
    title: config.site.name,
    description: config.site.description,
  }),
  twitter: {
    card: "summary_large_image",
  },
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
      lang="ko"
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
        {/* lazyOnload: window load 뒤에 불러와 첫 화면을 막지 않는다. */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="gtag" strategy="lazyOnload">
              {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
