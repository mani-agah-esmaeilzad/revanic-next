// src/app/tags/[name]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination"; // <-- ایمپورت کامپوننت
import type { Metadata } from "next";
import { buildCanonical } from "@/lib/seo";

const ARTICLES_PER_PAGE = 10; // <-- تعداد مقالات در هر صفحه

interface TagPageProps {
    params: {
        name: string;
    };
    searchParams: {
        page?: string;
    };
}

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const tagName = decodeURIComponent(params.name);
  const tag = await prisma.tag.findUnique({
    where: { name: tagName },
    select: { name: true },
  });

  if (!tag) {
    return {
      title: "تگ یافت نشد | روانک",
      description: "تگ مورد نظر در مجله روانک پیدا نشد.",
    };
  }

  const canonical = buildCanonical(`/tags/${encodeURIComponent(tag.name)}`);
  const description = `آخرین مقالات مرتبط با تگ «${tag.name}» را در مجله روانک دنبال کنید.`;

  return {
    title: `مقالات «${tag.name}» | روانک`,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: `مقالات «${tag.name}» | روانک`,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `مقالات «${tag.name}»`,
      description,
    },
  };
}

const TagPage = async ({ params, searchParams }: TagPageProps) => {
    const tagName = decodeURIComponent(params.name);
    const currentPage = Number(searchParams.page) || 1;

    const tag = await prisma.tag.findUnique({
        where: { name: tagName },
        include: {
            // 1. دریافت تعداد کل مقالات برای این تگ
            _count: {
                select: { articles: true },
            },
        },
    });

    if (!tag) {
        notFound();
    }

    // 2. دریافت مقالات صفحه‌بندی شده برای این تگ
    const articles = await prisma.article.findMany({
        where: {
            status: "APPROVED",
            tags: {
                some: {
                    tag: {
                        name: tagName,
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * ARTICLES_PER_PAGE,
        take: ARTICLES_PER_PAGE,
        include: {
            author: { select: { name: true, avatarUrl: true } },
            categories: { select: { name: true } },
            _count: { select: { claps: true, comments: true } },
        },
    });

    const totalArticles = tag._count.articles;
    const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-2">
                    مقالات با تگ: <span className="text-primary">{tagName}</span>
                </h1>
                <p className="text-center text-muted-foreground mb-8">
                    {totalArticles} مقاله یافت شد
                </p>

                {articles.length > 0 ? (
                    <div className="space-y-6">
                        {articles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                id={article.id.toString()}
                                slug={article.slug}
                                title={article.title}
                                excerpt={
                                    article.content.substring(0, 200).replace(/<[^>]*>?/gm, "") +
                                    "..."
                                }
                                author={{
                                    name: article.author.name || "ناشناس",
                                    avatar: article.author.avatarUrl || undefined,
                                }}
                                readTime={Math.ceil(article.content.length / 1000)}
                                publishDate={new Intl.DateTimeFormat("fa-IR").format(
                                    article.createdAt
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
                        مقاله‌ای با این تگ یافت نشد.
                    </p>
                )}

                {/* 3. نمایش کامپوننت صفحه‌بندی */}
                <div className="mt-12">
                    <Pagination totalPages={totalPages} currentPage={currentPage} />
                </div>
            </div>
        </div>
    );
};

export default TagPage;
