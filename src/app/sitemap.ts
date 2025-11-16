// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import path from "path";
import { promises as fs } from "fs";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getDeploymentUrl } from "@/lib/seo";

export const dynamic = "force-dynamic"; // always rebuild the sitemap so new URLs show up immediately

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

const FALLBACK_STATIC_PATHS = [
  "/",
  "/about",
  "/admin",
  "/admin/manage",
  "/articles",
  "/authors",
  "/authors-guide",
  "/categories",
  "/contact",
  "/editorial-guide",
  "/insights",
  "/login",
  "/offline",
  "/privacy",
  "/profile",
  "/publications",
  "/publications/new",
  "/register",
  "/search",
  "/series",
  "/subscription",
  "/support",
  "/terms",
  "/write",
];

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

const isLocalLike = (url?: string) => (url ? /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url) : false);

async function directoryExists(directory: string) {
  try {
    await fs.access(directory);
    return true;
  } catch {
    return false;
  }
}

const buildFallbackStaticRoutes = (origin: string): MetadataRoute.Sitemap =>
  FALLBACK_STATIC_PATHS.map((pathname) => {
    const normalized = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
    const override = STATIC_ROUTE_OVERRIDES[normalized];
    const config = override ?? DEFAULT_STATIC_ROUTE_CONFIG;

    return {
      url: `${origin}${normalized}`,
      changeFrequency: config.changeFrequency,
      priority: config.priority,
    };
  });

async function collectStaticRoutes(origin: string): Promise<MetadataRoute.Sitemap> {
  const appDir = path.join(process.cwd(), "src/app");
  const routes = new Map<string, { changeFrequency: ChangeFrequency; priority: number }>();
  const hasSourceDirectory = await directoryExists(appDir);

  if (!hasSourceDirectory) {
    return buildFallbackStaticRoutes(origin);
  }

  const stack: Array<{ dir: string; segments: string[] }> = [{ dir: appDir, segments: [] }];

  try {
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
  } catch (error) {
    console.error("SITEMAP_STATIC_ROUTE_DISCOVERY_ERROR", error);
    return buildFallbackStaticRoutes(origin);
  }

  return Array.from(routes.entries()).map(([pathname, config]) => ({
    url: `${origin}${pathname}`,
    changeFrequency: config.changeFrequency,
    priority: config.priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getDeploymentUrl();
  const headerList = headers();
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const hostValue = forwardedHost?.split(",")[0]?.trim();
  const protoValue = forwardedProto?.split(",")[0]?.trim();

  const requestOrigin = hostValue ? `${protoValue || "https"}://${hostValue}` : undefined;

  const normalizedConfiguredBase =
    baseUrl && !isLocalLike(baseUrl) ? baseUrl.replace(/\/$/, "") : undefined;
  const normalizedRequestOrigin = requestOrigin ? requestOrigin.replace(/\/$/, "") : undefined;
  const normalizedBase = baseUrl ? baseUrl.replace(/\/$/, "") : undefined;

  const origin = normalizedConfiguredBase ?? normalizedRequestOrigin ?? normalizedBase ?? "https://revanac.example";

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
