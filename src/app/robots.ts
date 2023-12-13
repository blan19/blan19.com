import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
      },
    ],
    sitemap: "https://www.blan19.com/sitemap.xml",
    host: "https://www.blan19.com",
  };
}
