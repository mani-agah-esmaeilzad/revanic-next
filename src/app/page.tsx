// src/app/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PenTool, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Logo from "@/components/Logo";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import { CommunitySpotlight } from "@/components/CommunitySpotlight";
import { getFeaturedCommunityStories } from "@/lib/community";
import { getUpcomingEditorialEntries } from "@/lib/editorial-guide";

export const dynamic = "force-dynamic";

const Index = async () => {
  const [
    articleCount,
    authorCount,
    dailyReadersCount,
    communityStories,
    upcomingEditorialEntries,
  ] = await Promise.all([
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
    getFeaturedCommunityStories(3),
    getUpcomingEditorialEntries(3),
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

  const editorialHighlights = upcomingEditorialEntries.map((entry) => ({
    title: entry.title,
    focus: entry.focus,
    date: new Date(entry.publishDate),
    description: entry.description,
  }));

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-journal-cream via-background to-journal-cream/50">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <Logo size="xl" className="justify-center mb-6" />
            </div>

            <h1 className="mb-6 text-3xl font-bold leading-tight text-journal sm:text-5xl md:text-6xl">
              جایی برای اشتراک
              <br />
              <span className="text-journal-orange">دانش و تجربه</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-journal-light sm:text-xl">
              در مجله روانیک، نویسندگان و خوانندگان فارسی‌زبان دور هم جمع می‌شوند تا
              بهترین مقالات را بخوانند، بنویسند و به اشتراک بگذارند.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
      <section className="bg-journal-cream/30 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
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
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="mb-4 text-2xl font-bold text-journal sm:text-3xl">مقالات برگزیده</h2>
            <p className="mx-auto max-w-2xl text-sm text-journal-light sm:text-base">
              بهترین مقالات هفته که توسط جامعه خوانندگان ما انتخاب شده‌اند
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>

          <div className="mt-10 text-center sm:mt-12">
            <Link href="/articles">
              <Button variant="outline" size="lg">
                مشاهده همه مقالات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Highlights */}
      <section className="py-20 bg-journal-cream/40">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-journal">برنامهٔ سردبیری پیش‌رو</h2>
              <p className="text-journal-light max-w-3xl mx-auto">
                نگاهی به رویدادها و پرونده‌های ویژهٔ سه ماه آینده بیندازید تا مقالهٔ خود را در زمان مناسب منتشر کنید.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {editorialHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-2xl bg-white/80 border border-journal-cream shadow-soft p-6 space-y-3"
                >
                  <div className="flex items-center justify-between text-sm text-journal-light">
                    <span>{highlight.focus}</span>
                    <span>{highlight.date.toLocaleDateString("fa-IR", { month: "long", day: "numeric" })}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-journal">{highlight.title}</h3>
                  {highlight.description ? (
                    <p className="text-sm text-journal-light leading-relaxed">{highlight.description}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/editorial-guide">
                <Button className="bg-journal-green hover:bg-journal text-white" size="lg">
                  مشاهده راهنمای لحن و تقویم
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CommunitySpotlight stories={communityStories} />

      {/* Insights Banner */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white/80 border border-journal-cream rounded-3xl shadow-soft p-10 space-y-4 text-center">
            <h2 className="text-3xl font-bold text-journal">گزارش رشد جامعه را دنبال کنید</h2>
            <p className="text-journal-light text-lg">
              آمار زندهٔ مقالات، نویسندگان و دسته‌های محبوب را در گزارش داستانی Insights بخوانید و به برنامه‌ریزی تیم خود سرعت بدهید.
            </p>
            <Link href="/insights">
              <Button
                variant="outline"
                size="lg"
                className="border-journal-green text-journal-green hover:bg-journal-green hover:text-white"
              >
                مشاهده گزارش ماهانه
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl text-white">
            <h2 className="mb-4 text-2xl font-bold text-journal sm:mb-6 sm:text-3xl">
              آماده‌اید داستان خود را بگویید؟
            </h2>
            <p className="mb-8 text-base opacity-90 text-journal sm:text-xl">
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
