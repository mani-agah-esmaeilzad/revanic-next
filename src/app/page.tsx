// src/app/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PenTool, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleCardProps } from "@/components/ArticleCard";
import Logo from "@/components/Logo";
import { subDays, formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import {
  CommunitySpotlight,
  type CommunitySpotlightStory,
} from "@/components/CommunitySpotlight";
import { getFeaturedCommunityStories } from "@/lib/community";
import { getUpcomingEditorialEntries } from "@/lib/editorial-guide";
import { calculateReadTime } from "@/lib/utils";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

function toPersianDigits(value: string) {
  return value.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function stripHtml(content: string) {
  return content.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

function buildExcerpt(content: string, limit = 180) {
  const text = stripHtml(content);
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

function formatPublishDate(date: Date) {
  const relative = formatDistanceToNow(date, { addSuffix: true, locale: faIR });
  return toPersianDigits(relative);
}

const Index = async () => {
  const [featuredArticlesRaw, articleCount, authorCount, dailyReadersCount] = await Promise.all([
    prisma.article.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        readTimeMinutes: true,
        createdAt: true,
        coverImageUrl: true,
        author: { select: { name: true, avatarUrl: true } },
        categories: { select: { name: true } },
        _count: { select: { claps: true, comments: true } },
      },
    }),
    prisma.article.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { articles: { some: { status: "APPROVED" } } } }),
    prisma.articleView.count({ where: { viewedAt: { gte: subDays(new Date(), 1) } } }),
  ]);

  const featuredArticles: ArticleCardProps[] = featuredArticlesRaw.map((article) => {
    const categoryName = article.categories[0]?.name ?? "عمومی";
    const publishDate = formatPublishDate(new Date(article.createdAt));
    const readTime = article.readTimeMinutes ?? calculateReadTime(article.content);

    return {
      id: article.id,
      title: article.title,
      excerpt: buildExcerpt(article.content),
      author: {
        name: article.author?.name ?? "ناشناس",
        avatar: article.author?.avatarUrl ?? "",
        avatarUrl: article.author?.avatarUrl ?? "",
      },
      readTime,
      publishDate,
      claps: article._count?.claps ?? 0,
      comments: article._count?.comments ?? 0,
      category: categoryName,
      image: article.coverImageUrl ?? null,
    };
  });

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
            {featuredArticles.length > 0 ? (
              featuredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  author={article.author}
                  readTime={article.readTime}
                  publishDate={article.publishDate}
                  claps={article.claps}
                  comments={article.comments}
                  category={article.category}
                  image={article.image}
                />
              ))
            ) : (
              <div className="rounded-md border border-dashed border-journal-cream bg-white/60 p-6 text-center text-sm text-journal-light">
                هنوز مقاله تایید شده‌ای برای نمایش وجود ندارد.
              </div>
            )}
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

      {/* Series Preview */}
      <section className="bg-journal-cream/40 py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center sm:flex-row sm:gap-10 sm:text-right">
            <div className="flex-1 space-y-3">
              <h2 className="text-2xl font-bold text-journal sm:text-3xl">سری‌های داستانی روانیک</h2>
              <p className="text-sm text-journal-light sm:text-base">
                مجموعه‌ای از مقالات دنباله‌دار که موضوعات مهم را مرحله‌به‌مرحله روایت می‌کند. با دنبال‌کردن هر سری
                می‌توانید پیشرفت خود را ثبت کنید و قسمت بعدی را از دست ندهید.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto">
              <Link href="/series">
                <Button size="lg" className="w-full sm:w-auto">
                  مشاهده سری‌ها
                </Button>
              </Link>
              <Link href="/articles" className="text-sm text-journal-green underline-offset-4 hover:underline">
                جدیدترین قسمت‌ها را در فهرست مقالات ببینید
              </Link>
            </div>
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
