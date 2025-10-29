// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getDeploymentUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getDeploymentUrl();
  const origin = baseUrl ? baseUrl.replace(/\/$/, "") : "https://revanic.example";

  let articles: Array<{ slug: string; updatedAt: Date }> = [];
  let series: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    [articles, series] = await Promise.all([
      prisma.article.findMany({
        where: { status: "APPROVED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      prisma.series.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);
  } catch (error) {
    console.error("SITEMAP_GENERATION_ERROR", error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${origin}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/articles`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${origin}/categories`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${origin}/series`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${origin}/articles/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const seriesEntries: MetadataRoute.Sitemap = series.map((item) => ({
    url: `${origin}/series/${item.slug}`,
    lastModified: item.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleEntries, ...seriesEntries];
}
