// src/app/articles/page.tsx
import { prisma } from "@/lib/prisma";
import ArticleCard from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";

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

interface ArticlesPageProps {
  searchParams: {
    page?: string;
    category?: string;
    categoryId?: string;
  };
}

const ArticlesPage = async ({ searchParams }: ArticlesPageProps) => {
  const currentPage = Number(searchParams.page) || 1;
  if (currentPage < 1) {
    return <p className="text-center">شماره صفحه نامعتبر است.</p>;
  }

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

  const categoryFilter = categoryId
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

  const where = {
    status: "APPROVED" as const,
    ...(categoryFilter || {}),
  };

  const totalArticles = await prisma.article.count({
    where,
  });
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ARTICLES_PER_PAGE,
    take: ARTICLES_PER_PAGE,
    include: {
      author: { select: { name: true, avatarUrl: true } },
      categories: { select: { name: true } },
      _count: { select: { claps: true, comments: true } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          {categoryFilter
            ? `مقالات مرتبط با ${activeCategoryTitle?.trim() || "موضوع انتخابی"}`
            : "آخرین مقالات"}
        </h1>
        {articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map((article) => {
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
                  publishDate={new Intl.DateTimeFormat("fa-IR").format(
                    new Date(article.createdAt)
                  )}
                  claps={article._count.claps}
                  comments={article._count.comments}
                  category={article.categories[0]?.name || "عمومی"}
                  image={article.coverImageUrl}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-16">
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