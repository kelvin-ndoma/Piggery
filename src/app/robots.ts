import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/platform/", "/dashboard", "/pigs", "/api/", "/actions/", "/no-access"],
    },
    sitemap: `${appBaseUrl()}/sitemap.xml`,
  };
}
