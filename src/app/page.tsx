// src/app/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PenTool, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Logo from "@/components/Logo";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

const Index = async () => {
  const [articleCount, authorCount, dailyReadersCount] = await Promise.all([
    prisma.article.count({ where: { status: "APPROVED" } }),
    prisma.user.count({
      where: {
        articles: { some: { status: "APPROVED" } },
      },
    }),
    prisma.articleView.count({
      where: {
        viewedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const featuredArticles = await prisma.article.findMany({
    where: { status: "APPROVED" },
    orderBy: [
      { claps: { _count: "desc" } },
      { views: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    take: 3,
    include: {
      author: { select: { name: true, avatarUrl: true } },
      categories: { select: { name: true } },
      _count: { select: { claps: true, comments: true } },
    },
  });

  const formattedArticles = featuredArticles.map((article) => {
    const plainContent = article.content.replace(/<[^>]*>?/gm, "");
    const publishDate = formatDistanceToNow(new Date(article.createdAt), {
      addSuffix: true,
      locale: faIR,
    });

    return {
      id: article.id.toString(),
      title: article.title,
      excerpt: plainContent.substring(0, 180) + (plainContent.length > 180 ? "..." : ""),
      author: {
        name: article.author.name || "ناشناس",
        avatar: article.author.avatarUrl || undefined,
      },
      readTime: article.readTimeMinutes || Math.max(1, Math.round(plainContent.length / 900)),
      publishDate,
      claps: article._count.claps,
      comments: article._count.comments,
      category: article.categories[0]?.name || "عمومی",
      image: article.coverImageUrl,
    };
  });

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-journal-cream via-background to-journal-cream/50">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Logo size="xl" className="justify-center mb-6" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-journal mb-6 leading-tight">
              جایی برای اشتراک
              <br />
              <span className="text-journal-orange">دانش و تجربه</span>
            </h1>

            <p className="text-xl text-journal-light mb-8 max-w-2xl mx-auto leading-relaxed">
              در مجله روانیک، نویسندگان و خوانندگان فارسی‌زبان دور هم جمع می‌شوند تا
              بهترین مقالات را بخوانند، بنویسند و به اشتراک بگذارند.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/articles">
                <Button size="lg" className="w-full sm:w-auto gradient-hero text-white hover:shadow-medium transition-all">
                  <BookOpen className="ml-2 h-5 w-5" />
                  شروع خواندن
                </Button>
              </Link>

              <Link href="/write">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-journal-green text-journal-green hover:bg-journal-green hover:text-white">
                  <PenTool className="ml-2 h-5 w-5" />
                  شروع نوشتن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">
                {articleCount.toLocaleString("fa-IR")}
              </div>
              <p className="text-journal-light">مقاله منتشر شده</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">
                {authorCount.toLocaleString("fa-IR")}
              </div>
              <p className="text-journal-light">نویسنده فعال</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">
                {dailyReadersCount.toLocaleString("fa-IR")}
              </div>
              <p className="text-journal-light">بازدید ۲۴ ساعت گذشته</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-journal mb-4">مقالات برگزیده</h2>
            <p className="text-journal-light max-w-2xl mx-auto">
              بهترین مقالات هفته که توسط جامعه خوانندگان ما انتخاب شده‌اند
            </p>
          </div>

          {formattedArticles.length > 0 ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {formattedArticles.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto text-center py-16 text-journal-light">
              هنوز مقاله تایید شده‌ای برای نمایش وجود ندارد. اولین نفری باشید که می‌نویسد!
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/articles">
              <Button variant="outline" size="lg">
                مشاهده همه مقالات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl font-bold mb-6 text-journal">
              آماده‌اید داستان خود را بگویید؟
            </h2>
            <p className="text-xl mb-8 opacity-90 text-journal">
              به جامعه نویسندگان و خوانندگان فارسی‌زبان بپیوندید و صدای خود را به گوش جهان برسانید
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-journal-green hover:bg-journal-cream">
                <Users className="ml-2 h-5 w-5" />
                عضویت رایگان
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
