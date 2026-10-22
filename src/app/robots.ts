import { MetadataRoute } from "next";
import config from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
      },
    ],
    sitemap: `${config.url}sitemap.xml`,
    host: new URL(config.url).origin,
  };
}
