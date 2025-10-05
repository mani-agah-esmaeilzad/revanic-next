// src/lib/series.ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SeriesListItem = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  curatorName?: string | null;
  articleCount: number;
  followerCount: number;
  progress: number;
  completedCount: number;
  isFollowing: boolean;
};

export type SeriesDetail = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  status: string;
  curatorName?: string | null;
  followerCount: number;
  isFollowing: boolean;
  progress: number;
  completedCount: number;
  articles: Array<{
    id: number;
    title: string;
    excerpt: string;
    order: number;
    publishDate: string;
    coverImageUrl?: string | null;
    readTimeMinutes: number;
    isCompleted: boolean;
  }>;
};

const SERIES_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  description: true,
  coverImageUrl: true,
  status: true,
  curator: { select: { name: true } },
  followers: { select: { userId: true } },
  articles: {
    select: {
      id: true,
      order: true,
      releaseAt: true,
      article: {
        select: {
          id: true,
          title: true,
          content: true,
          readTimeMinutes: true,
          coverImageUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { order: "asc" as const },
  },
} satisfies Prisma.SeriesSelect;

function stripHtml(content: string) {
  return content.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

function buildExcerpt(content: string, limit = 180) {
  const text = stripHtml(content);
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

function estimateReadTimeMinutes(value: number | null, content: string) {
  if (value && value > 0) return value;
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getPublishedSeriesList(userId?: number | null): Promise<SeriesListItem[]> {
  const [seriesRecords, history] = await Promise.all([
    prisma.series.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: SERIES_SELECT,
    }),
    userId
      ? prisma.readingHistory.findMany({
          where: { userId },
          select: { articleId: true },
        })
      : Promise.resolve([]),
  ]);

  const readSet = new Set(history.map((item) => item.articleId));

  return seriesRecords.map((series) => {
    const isFollowing = userId
      ? series.followers.some((follower) => follower.userId === userId)
      : false;
    const articleCount = series.articles.length;
    const completedCount = series.articles.filter((entry) =>
      readSet.has(entry.article.id)
    ).length;
    const progress = articleCount === 0 ? 0 : Math.round((completedCount / articleCount) * 100);

    return {
      id: series.id,
      slug: series.slug,
      title: series.title,
      subtitle: series.subtitle,
      description: series.description,
      coverImageUrl: series.coverImageUrl,
      curatorName: series.curator?.name ?? null,
      articleCount,
      followerCount: series.followers.length,
      progress,
      completedCount,
      isFollowing,
    };
  });
}

export async function getSeriesDetail(
  slug: string,
  userId?: number | null
): Promise<SeriesDetail | null> {
  const series = await prisma.series.findUnique({
    where: { slug },
    select: SERIES_SELECT,
  });

  if (!series || series.status !== "PUBLISHED") {
    return null;
  }

  const [history, follow] = await Promise.all([
    userId
      ? prisma.readingHistory.findMany({
          where: { userId },
          select: { articleId: true },
        })
      : Promise.resolve([]),
    userId
      ? prisma.seriesFollow.findUnique({
          where: {
            userId_seriesId: {
              userId,
              seriesId: series.id,
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const readSet = new Set(history.map((item) => item.articleId));
  const articles = series.articles.map((entry) => {
    const article = entry.article;
    return {
      id: article.id,
      title: article.title,
      excerpt: buildExcerpt(article.content),
      order: entry.order,
      publishDate: entry.releaseAt?.toISOString() ?? article.createdAt.toISOString(),
      coverImageUrl: article.coverImageUrl,
      readTimeMinutes: estimateReadTimeMinutes(article.readTimeMinutes, article.content),
      isCompleted: readSet.has(article.id),
    };
  });

  const completedCount = articles.filter((item) => item.isCompleted).length;
  const progress = articles.length === 0 ? 0 : Math.round((completedCount / articles.length) * 100);

  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    subtitle: series.subtitle,
    description: series.description,
    coverImageUrl: series.coverImageUrl,
    status: series.status,
    curatorName: series.curator?.name ?? null,
    followerCount: series.followers.length,
    isFollowing: Boolean(follow),
    progress,
    completedCount,
    articles,
  };
}

export async function followSeries(seriesId: number, userId: number) {
  await prisma.seriesFollow.upsert({
    where: {
      userId_seriesId: {
        userId,
        seriesId,
      },
    },
    create: {
      userId,
      seriesId,
    },
    update: {},
  });
}

export async function unfollowSeries(seriesId: number, userId: number) {
  await prisma.seriesFollow.deleteMany({
    where: {
      userId,
      seriesId,
    },
  });
}

export function findNextArticle(articles: SeriesDetail["articles"], readSet: Set<number>) {
  const unread = articles.find((item) => !readSet.has(item.id));
  return unread ?? articles[articles.length - 1] ?? null;
}

export async function getFollowedSeriesList(userId: number): Promise<SeriesListItem[]> {
  const list = await getPublishedSeriesList(userId);
  return list.filter((item) => item.isFollowing);
}
