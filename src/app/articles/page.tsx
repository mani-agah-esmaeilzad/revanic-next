// src/app/articles/page.tsx
import { Prisma } from "@prisma/client";

import ArticleCard from "@/components/ArticleCard";
import ArticlesFilterBar, {
  type LengthOption,
  type SortOption,
  type ViewOption,
} from "@/components/ArticlesFilterBar";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

const EXCERPT_LIMIT = 200;

const extractPlainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildExcerpt = (text: string, limit: number) => {
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
};

const estimateReadTime = (stored: number | null | undefined, plainText: string) => {
  if (stored && stored > 0) return stored;
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const ARTICLES_PER_PAGE = 10;
const SORT_VALUES: SortOption[] = ["newest", "popular", "discussion"];
const LENGTH_VALUES: LengthOption[] = ["all", "short", "medium", "long"];
const VIEW_VALUES: ViewOption[] = ["list", "grid"];

const articleInclude = {
  author: { select: { name: true, avatarUrl: true } },
  categories: { select: { name: true } },
  _count: { select: { claps: true, comments: true } },
} satisfies Prisma.ArticleInclude;

type ArticleRecord = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

const isSortOption = (value: string | undefined): value is SortOption =>
  !!value && SORT_VALUES.includes(value as SortOption);

const isLengthOption = (value: string | undefined): value is LengthOption =>
  !!value && LENGTH_VALUES.includes(value as LengthOption);

const isViewOption = (value: string | undefined): value is ViewOption =>
  !!value && VIEW_VALUES.includes(value as ViewOption);

interface ArticlesPageProps {
  searchParams: {
    page?: string;
    category?: string;
    categoryId?: string;
    sort?: string;
    length?: string;
    view?: string;
    q?: string;
  };
}

const ArticlesPage = async ({ searchParams }: ArticlesPageProps) => {
  const currentPage = Number(searchParams.page) || 1;
  if (currentPage < 1) {
    return <p className="text-center">شماره صفحه نامعتبر است.</p>;
  }

  const sortParam: SortOption = isSortOption(searchParams.sort) ? (searchParams.sort as SortOption) : "newest";
  const lengthParam: LengthOption = isLengthOption(searchParams.length)
    ? (searchParams.length as LengthOption)
    : "all";
  const viewParam: ViewOption = isViewOption(searchParams.view) ? (searchParams.view as ViewOption) : "list";
  const searchTerm = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const { category, categoryId } = searchParams;
  let activeCategoryTitle: string | null = null;

  if (categoryId) {
    const categoryRecord = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
      select: { name: true },
    });
    activeCategoryTitle = categoryRecord?.name || null;
  } else if (category) {
    activeCategoryTitle = decodeURIComponent(category);
  }

  const categoryFilter: Prisma.ArticleWhereInput | undefined = categoryId
    ? {
        categories: {
          some: { id: Number(categoryId) },
        },
      }
    : activeCategoryTitle
    ? {
        categories: {
          some: { name: activeCategoryTitle },
        },
      }
    : undefined;

  let readTimeFilter: Prisma.ArticleWhereInput | undefined;
  if (lengthParam === "short") {
    readTimeFilter = { readTimeMinutes: { not: null, lte: 4 } };
  } else if (lengthParam === "medium") {
    readTimeFilter = { readTimeMinutes: { not: null, gt: 4, lt: 10 } };
  } else if (lengthParam === "long") {
    readTimeFilter = { readTimeMinutes: { not: null, gte: 10 } };
  }

  const searchFilter: Prisma.ArticleWhereInput | undefined = searchTerm
    ? {
        OR: [
          { title: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { content: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : undefined;

  const whereFilters: Prisma.ArticleWhereInput[] = [{ status: "APPROVED" }];
  if (categoryFilter) whereFilters.push(categoryFilter);
  if (readTimeFilter) whereFilters.push(readTimeFilter);
  if (searchFilter) whereFilters.push(searchFilter);

  const where: Prisma.ArticleWhereInput = whereFilters.length > 1 ? { AND: whereFilters } : whereFilters[0];

  const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
    sortParam === "popular"
      ? [{ claps: { _count: "desc" } }, { createdAt: "desc" }]
      : sortParam === "discussion"
      ? [{ comments: { _count: "desc" } }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const articlesPromise = prisma.article.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * ARTICLES_PER_PAGE,
    take: ARTICLES_PER_PAGE,
    include: articleInclude,
  });

  const trendingPromise = currentPage === 1
    ? prisma.article.findMany({
        where: { status: "APPROVED" },
        orderBy: [
          { claps: { _count: "desc" } },
          { comments: { _count: "desc" } },
          { createdAt: "desc" },
        ],
        take: 3,
        include: articleInclude,
      })
    : Promise.resolve<ArticleRecord[]>([]);

  const [totalArticles, articleRecords, trendingRecords] = (await Promise.all([
    prisma.article.count({ where }),
    articlesPromise,
    trendingPromise,
  ])) as [number, ArticleRecord[], ArticleRecord[]];

  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
  const preservedParams = {
    category: searchParams.category,
    categoryId: searchParams.categoryId,
  };

  const pageTitle = activeCategoryTitle
    ? `مقالات مرتبط با ${activeCategoryTitle}`
    : searchTerm
    ? `نتایج جست‌وجو برای «${searchTerm}»`
    : "آخرین مقالات";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-journal sm:text-5xl">{pageTitle}</h1>
          {lengthParam !== "all" ? (
            <p className="mt-2 text-sm text-journal-light">
              نمایش مقالات با زمان مطالعه {lengthParam === "short" ? "کوتاه" : lengthParam === "medium" ? "متوسط" : "بلند"}.
            </p>
          ) : null}
        </div>

        <ArticlesFilterBar
          sort={sortParam}
          length={lengthParam}
          view={viewParam}
          search={searchTerm}
          preservedParams={preservedParams}
        />

        {currentPage === 1 && trendingRecords.length > 0 ? (
          <section className="rounded-3xl bg-journal-cream/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-journal">مقالات پرطرفدار</h2>
              <Badge variant="outline" className="border-journal-green text-journal-green">
                بر اساس تعاملات اخیر
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {trendingRecords.map((article) => {
                const plainText = extractPlainText(article.content);
                const excerpt = buildExcerpt(plainText, 160);
                const readTime = estimateReadTime(article.readTimeMinutes, plainText);
                return (
                  <ArticleCard
                    key={`trending-${article.id}`}
                    id={article.id.toString()}
                    title={article.title}
                    excerpt={excerpt}
                    author={{
                      name: article.author.name || "ناشناس",
                      avatar: article.author.avatarUrl || undefined,
                    }}
                    readTime={readTime}
                    publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                    claps={article._count.claps}
                    comments={article._count.comments}
                    category={article.categories[0]?.name || "عمومی"}
                    image={article.coverImageUrl}
                    className="h-full border border-journal-green/20"
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {articleRecords.length > 0 ? (
          viewParam === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2">
              {articleRecords.map((article) => {
                const plainText = extractPlainText(article.content);
                const excerpt = buildExcerpt(plainText, EXCERPT_LIMIT);
                const readTime = estimateReadTime(article.readTimeMinutes, plainText);

                return (
                  <ArticleCard
                    key={article.id}
                    id={article.id.toString()}
                    title={article.title}
                    excerpt={excerpt}
                    author={{
                      name: article.author.name || "ناشناس",
                      avatar: article.author.avatarUrl || undefined,
                    }}
                    readTime={readTime}
                    publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                    claps={article._count.claps}
                    comments={article._count.comments}
                    category={article.categories[0]?.name || "عمومی"}
                    image={article.coverImageUrl}
                    className="h-full"
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {articleRecords.map((article) => {
                const plainText = extractPlainText(article.content);
                const excerpt = buildExcerpt(plainText, EXCERPT_LIMIT);
                const readTime = estimateReadTime(article.readTimeMinutes, plainText);

                return (
                  <ArticleCard
                    key={article.id}
                    id={article.id.toString()}
                    title={article.title}
                    excerpt={excerpt}
                    author={{
                      name: article.author.name || "ناشناس",
                      avatar: article.author.avatarUrl || undefined,
                    }}
                    readTime={readTime}
                    publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                    claps={article._count.claps}
                    comments={article._count.comments}
                    category={article.categories[0]?.name || "عمومی"}
                    image={article.coverImageUrl}
                  />
                );
              })}
            </div>
          )
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            مقاله‌ای برای نمایش وجود ندارد.
          </p>
        )}

        <div className="mt-12">
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;
