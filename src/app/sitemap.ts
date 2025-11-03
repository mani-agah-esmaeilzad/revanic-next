// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import path from "path";
import { promises as fs } from "fs";

import { prisma } from "@/lib/prisma";
import { getDeploymentUrl } from "@/lib/seo";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTE_OVERRIDES: Record<
  string,
  { changeFrequency: ChangeFrequency; priority: number }
> = {
  "/": { changeFrequency: "daily", priority: 1 },
  "/articles": { changeFrequency: "daily", priority: 0.8 },
  "/series": { changeFrequency: "weekly", priority: 0.6 },
  "/categories": { changeFrequency: "weekly", priority: 0.6 },
};

const DEFAULT_STATIC_ROUTE_CONFIG: { changeFrequency: ChangeFrequency; priority: number } = {
  changeFrequency: "weekly",
  priority: 0.5,
};

const PAGE_FILE_PATTERN = /^page\.(t|j)sx?$/;

const sanitizeSegment = (segment: string) => {
  if (segment.startsWith("(") && segment.endsWith(")")) {
    return "";
  }
  return segment;
};

const isIgnorableSegment = (segment: string) =>
  segment.startsWith("_") || segment.includes("[") || segment === "api";

async function collectStaticRoutes(origin: string): Promise<MetadataRoute.Sitemap> {
  const appDir = path.join(process.cwd(), "src/app");
  const routes = new Map<
    string,
    { changeFrequency: ChangeFrequency; priority: number }
  >();

  const stack: Array<{ dir: string; segments: string[] }> = [{ dir: appDir, segments: [] }];

  while (stack.length > 0) {
    const { dir, segments } = stack.pop()!;
    let hasPageFile = false;

    const dirents = await fs.readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
      if (dirent.isFile() && PAGE_FILE_PATTERN.test(dirent.name)) {
        hasPageFile = true;
        continue;
      }

      if (dirent.isDirectory()) {
        const segment = dirent.name;
        if (isIgnorableSegment(segment)) {
          continue;
        }

        stack.push({
          dir: path.join(dir, segment),
          segments: [...segments, segment],
        });
      }
    }

    if (!hasPageFile || segments.some((segment) => segment.includes("["))) {
      continue;
    }

    const cleanSegments = segments
      .map(sanitizeSegment)
      .filter(Boolean)
      .map((segment) => segment.replace(/\/+/g, ""));

    const pathname = cleanSegments.length > 0 ? `/${cleanSegments.join("/")}` : "/";
    const normalized = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");

    const override = STATIC_ROUTE_OVERRIDES[normalized];
    const config = override ?? DEFAULT_STATIC_ROUTE_CONFIG;

    routes.set(normalized, config);
  }

  return Array.from(routes.entries()).map(([pathname, config]) => ({
    url: `${origin}${pathname}`,
    changeFrequency: config.changeFrequency,
    priority: config.priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getDeploymentUrl();
  const origin = baseUrl ? baseUrl.replace(/\/$/, "") : "https://revanac.example";

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

  const staticRoutes = await collectStaticRoutes(origin);

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
