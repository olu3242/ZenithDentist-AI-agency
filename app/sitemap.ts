import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.NEXT_PUBLIC_SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}/admin`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}/portal`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.2
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}/internal/organizations`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.1
    }
  ];
}
