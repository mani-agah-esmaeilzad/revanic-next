// src/app/robots.ts
import type { MetadataRoute } from "next";
import { getDeploymentUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getDeploymentUrl();
  const sitemapUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/sitemap.xml` : undefined;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: sitemapUrl,
  };
}
