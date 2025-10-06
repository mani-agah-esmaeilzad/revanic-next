import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type RangeOption = "7d" | "30d" | "90d" | "365d" | "all";

export interface ReadingHistoryFilters {
  search?: string;
  range?: RangeOption;
  categoryId?: number;
  limit?: number;
}

export interface ReadingHistoryEntry {
  viewedAt: Date;
  progress: number;
  article: Prisma.ArticleGetPayload<{
    include: {
      author: { select: { name: true; avatarUrl: true } };
      categories: { select: { name: true } };
      _count: { select: { claps: true; comments: true } };
    };
  }>;
}

const resolveRange = (range?: RangeOption) => {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "365d":
      return 365;
    default:
      return undefined;
  }
};

export async function getReadingHistoryEntries(
  userId: number,
  { search, range = "30d", categoryId, limit = 50 }: ReadingHistoryFilters = {}
): Promise<ReadingHistoryEntry[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);
  const days = resolveRange(range);

  const where: Prisma.ReadingHistoryWhereInput = {
    userId,
  };

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    where.viewedAt = { gte: since };
  }

  const articleFilters: Prisma.ArticleWhereInput = {};

  if (search) {
    const normalizedSearch = search.trim();
    if (normalizedSearch.length > 0) {
      articleFilters.OR = [
        { title: { contains: normalizedSearch, mode: "insensitive" } },
        { content: { contains: normalizedSearch, mode: "insensitive" } },
        {
          categories: {
            some: { name: { contains: normalizedSearch, mode: "insensitive" } },
          },
        },
      ];
    }
  }

  if (categoryId) {
    articleFilters.categories = {
      some: { id: categoryId },
    };
  }

  if (Object.keys(articleFilters).length > 0) {
    where.article = {
      ...articleFilters,
    };
  }

  const history = await prisma.readingHistory.findMany({
    where,
    orderBy: { viewedAt: "desc" },
    take: normalizedLimit,
    include: {
      article: {
        include: {
          author: { select: { name: true, avatarUrl: true } },
          categories: { select: { name: true } },
          _count: { select: { claps: true, comments: true } },
        },
      },
    },
  });

  return history.map((entry) => ({
    viewedAt: entry.viewedAt,
    progress: entry.progress,
    article: entry.article,
  }));
}
