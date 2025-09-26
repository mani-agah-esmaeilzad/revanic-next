// src/app/articles/page.tsx
import { prisma } from "@/lib/prisma";
import ArticleCard from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";

const ARTICLES_PER_PAGE = 10;

interface ArticlesPageProps {
  searchParams: {
    page?: string;
  };
}

const ArticlesPage = async ({ searchParams }: ArticlesPageProps) => {
  const currentPage = Number(searchParams.page) || 1;
  if (currentPage < 1) {
    return <p className="text-center">شماره صفحه نامعتبر است.</p>;
  }

  const totalArticles = await prisma.article.count({
    where: { status: "APPROVED" },
  });
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

  const articles = await prisma.article.findMany({
    where: { status: "APPROVED" },
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
          آخرین مقالات
        </h1>
        {articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id.toString()}
                title={article.title}
                excerpt={
                  article.content.substring(0, 200).replace(/<[^>]*>?/gm, "") +
                  "..."
                }
                author={{
                  name: article.author.name || "ناشناس",
                  avatar: article.author.avatarUrl || undefined,
                }}
                readTime={article.readTimeMinutes || 1}
                publishDate={new Intl.DateTimeFormat("fa-IR").format(
                  new Date(article.createdAt)
                )}
                claps={article._count.claps}
                comments={article._count.comments}
                category={article.categories[0]?.name || "عمومی"}
                image={article.coverImageUrl}
              />
            ))}
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