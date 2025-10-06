// src/lib/series.ts
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
  notifyByEmail: boolean;
  progress: number;
  completedCount: number;
  upcomingCount: number;
  articles: Array<{
    id: number;
    title: string;
    excerpt: string;
    order: number;
    publishDate: string;
    releaseAt?: string | null;
    releasedAt?: string | null;
    coverImageUrl?: string | null;
    readTimeMinutes: number;
    progress: number;
    isCompleted: boolean;
    isReleased: boolean;
  }>;
};

type ReadingHistoryRecord = { articleId: number; progress: number };

type SeriesRecord = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  status: string;
  curator?: { name?: string | null } | null;
  followers: Array<{ userId: number }>;
  articles: Array<{
    id: number;
    order: number;
    releaseAt: Date | null;
    releasedAt: Date | null;
    notifiedAt: Date | null;
    article: {
      id: number;
      title: string;
      content: string;
      readTimeMinutes: number | null;
      coverImageUrl?: string | null;
      createdAt: Date;
    };
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
      releasedAt: true,
      notifiedAt: true,
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
} as const;

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
  const client = prisma as any;
  const seriesDelegate = client.series;
  const historyDelegate = client.readingHistory;

  if (!seriesDelegate) {
    return [];
  }

  const [seriesRecords, history] = (await Promise.all([
    seriesDelegate.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: SERIES_SELECT,
    }),
    userId && historyDelegate
      ? historyDelegate.findMany({
          where: { userId },
          select: { articleId: true, progress: true },
        })
      : Promise.resolve<ReadingHistoryRecord[]>([]),
  ])) as [SeriesRecord[], ReadingHistoryRecord[]];

  const progressMap = new Map(history.map((item) => [item.articleId, item.progress ?? 0]));

  return seriesRecords.map((series) => {
    const isFollowing = userId
      ? series.followers.some((follower) => follower.userId === userId)
      : false;
    const now = new Date();
    const releasedEntries = series.articles.filter((entry) => {
      if (entry.releasedAt) return true;
      if (!entry.releaseAt) return true;
      return entry.releaseAt <= now;
    });

    const completedCount = releasedEntries.filter((entry) => {
      const progress = progressMap.get(entry.article.id) ?? 0;
      return progress >= 0.9;
    }).length;

    const articleCount = releasedEntries.length;
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
  const client = prisma as any;
  const seriesDelegate = client.series;
  const historyDelegate = client.readingHistory;
  const followDelegate = client.seriesFollow;

  if (!seriesDelegate) {
    return null;
  }

  const series = (await seriesDelegate.findUnique({
    where: { slug },
    select: SERIES_SELECT,
  })) as SeriesRecord | null;

  if (!series || series.status !== "PUBLISHED") {
    return null;
  }

  const [history, follow] = (await Promise.all([
    userId && historyDelegate
      ? historyDelegate.findMany({
          where: { userId },
          select: { articleId: true, progress: true },
        })
      : Promise.resolve<ReadingHistoryRecord[]>([]),
    userId && followDelegate
      ? followDelegate.findUnique({
          where: {
            userId_seriesId: {
              userId,
              seriesId: series.id,
            },
          },
          select: {
            notifyByEmail: true,
          },
        })
      : Promise.resolve(null),
  ])) as [ReadingHistoryRecord[], any];

  const progressMap = new Map(history.map((item) => [item.articleId, item.progress ?? 0]));
  const now = new Date();

  const articles = series.articles.map((entry) => {
    const article = entry.article;
    const isReleased = entry.releasedAt
      ? true
      : entry.releaseAt
        ? entry.releaseAt <= now
        : true;
    const progress = progressMap.get(article.id) ?? 0;
    return {
      id: article.id,
      title: article.title,
      excerpt: buildExcerpt(article.content),
      order: entry.order,
      publishDate: entry.releasedAt?.toISOString() ?? entry.releaseAt?.toISOString() ?? article.createdAt.toISOString(),
      releaseAt: entry.releaseAt?.toISOString() ?? null,
      releasedAt: entry.releasedAt?.toISOString() ?? null,
      coverImageUrl: article.coverImageUrl,
      readTimeMinutes: estimateReadTimeMinutes(article.readTimeMinutes, article.content),
      progress,
      isCompleted: progress >= 0.9,
      isReleased,
    };
  });

  const releasedArticles = articles.filter((article) => article.isReleased);
  const completedCount = releasedArticles.filter((item) => item.isCompleted).length;
  const progress = releasedArticles.length === 0 ? 0 : Math.round((completedCount / releasedArticles.length) * 100);
  const upcomingCount = articles.length - releasedArticles.length;

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
    notifyByEmail: Boolean(follow?.notifyByEmail),
    progress,
    completedCount,
    upcomingCount,
    articles,
  };
}

export async function followSeries(
  seriesId: number,
  userId: number,
  options: { notifyByEmail?: boolean } = {}
) {
  const delegate = (prisma as any).seriesFollow;
  if (!delegate) return;

  const createData: {
    userId: number;
    seriesId: number;
    notifyByEmail?: boolean;
  } = {
    userId,
    seriesId,
  };

  const updateData: { notifyByEmail?: boolean } = {};

  if (options.notifyByEmail !== undefined) {
    createData.notifyByEmail = options.notifyByEmail;
    updateData.notifyByEmail = options.notifyByEmail;
  }

  await delegate.upsert({
    where: {
      userId_seriesId: {
        userId,
        seriesId,
      },
    },
    create: createData,
    update: updateData,
  });
}

export async function unfollowSeries(seriesId: number, userId: number) {
  const delegate = (prisma as any).seriesFollow;
  if (!delegate) return;

  await delegate.deleteMany({
    where: {
      userId,
      seriesId,
    },
  });
}

export async function updateSeriesNotificationPreferences(
  seriesId: number,
  userId: number,
  { notifyByEmail }: { notifyByEmail: boolean }
) {
  const delegate = (prisma as any).seriesFollow;
  if (!delegate) return;

  await delegate.update({
    where: {
      userId_seriesId: {
        userId,
        seriesId,
      },
    },
    data: { notifyByEmail },
  });
}

export function findNextArticle(articles: SeriesDetail["articles"], readSet: Set<number>) {
  const releasedArticles = articles.filter((item) => item.isReleased);
  const unread = releasedArticles.find((item) => !readSet.has(item.id));
  return unread ?? releasedArticles[releasedArticles.length - 1] ?? null;
}

export async function getFollowedSeriesList(userId: number): Promise<SeriesListItem[]> {
  const list = await getPublishedSeriesList(userId);
  return list.filter((item) => item.isFollowing);
}
