import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

// 모든 크롤러에 전체 허용을 명시한다. Host 는 비표준(Yandex 전용, 폐기) 지시어라 두지 않는다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}sitemap.xml`,
  };
}
