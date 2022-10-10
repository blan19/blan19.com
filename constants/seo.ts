import { DefaultSeoProps } from "next-seo";

const seo: DefaultSeoProps = {
  openGraph: {
    type: "website",
    locale: "ko-KR",
    url: "https://www.blan19.com/",
    site_name: "blan19",
    description: "blan19의 블로그입니다.",
    defaultImageWidth: 1200,
    defaultImageHeight: 600,
  },
  twitter: {
    handle: "@blan19",
    site: "@https://www.blan19.com/",
    cardType: "summary_large_image",
  },
  defaultTitle: "blan19",
};

export default seo;
