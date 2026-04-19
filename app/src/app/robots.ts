import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    // `/embed/*` is noindexed by its own <meta robots> (PR #56) but we also
    // disallow it here so crawlers don't waste budget discovering iframe URLs.
    // `/api/*` responses are meant for programmatic clients, not search.
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/embed/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
