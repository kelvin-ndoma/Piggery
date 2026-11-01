import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: appBaseUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
