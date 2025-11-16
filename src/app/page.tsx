// src/app/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PenTool, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleCardProps } from "@/components/ArticleCard";
import Logo from "@/components/Logo";
import type { Metadata } from "next";
import Script from "next/script";
import { buildCanonical, organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

const canonicalHome = buildCanonical("/");
const EXCERPT_LIMIT = 200;
const persianNumberFormatter = new Intl.NumberFormat("fa-IR");

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const buildExcerpt = (html: string) => {
  const text = stripHtml(html);
  if (!text) return "";
  return text.length > EXCERPT_LIMIT ? `${text.slice(0, EXCERPT_LIMIT).trimEnd()}…` : text;
};

const estimateReadTime = (stored: number | null | undefined, plainText: string) => {
  if (stored && stored > 0) return stored;
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const formatRelativeDate = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.round(diffMs / minute));
    return `${persianNumberFormatter.format(minutes)} دقیقه پیش`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour));
    return `${persianNumberFormatter.format(hours)} ساعت پیش`;
  }

  if (diffMs < week) {
    const days = Math.max(1, Math.round(diffMs / day));
    return `${persianNumberFormatter.format(days)} روز پیش`;
  }

  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
};

export const metadata: Metadata = {
  title: "مجله روانک | جایی برای اشتراک دانش و تجربه",
  description:
    "روانک بستری فارسی برای مطالعه و انتشار مقالات باکیفیت در حوزه‌های فناوری، فرهنگ، تاریخ و سبک زندگی است.",
  ...(canonicalHome ? { alternates: { canonical: canonicalHome } } : {}),
  openGraph: {
    title: "مجله روانک | جایی برای اشتراک دانش و تجربه",
    description:
      "روانک جامعه‌ای برای نویسندگان و خوانندگان فارسی‌زبان است تا تجربه‌ها و دانش خود را در قالب مقاله به اشتراک بگذارند.",
    url: canonicalHome,
    siteName: "روانک",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "مجله روانک",
    description:
      "بهترین مقالات فارسی در حوزه‌های مختلف را در روانک بخوانید و تجربه خود را منتشر کنید.",
  },
};

const Index = async () => {
  const twentyFourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const [articleCount, authorRecords, dailyReadersCount, featuredArticleRecords] = await Promise.all([
    prisma.article.count({ where: { status: "APPROVED" } }),
    prisma.article.findMany({
      where: { status: "APPROVED" },
      select: { authorId: true },
      distinct: ["authorId"],
    }),
    prisma.articleView.count({ where: { viewedAt: { gte: twentyFourHoursAgo } } }),
    prisma.article.findMany({
      where: { status: "APPROVED" },
      orderBy: [
        { claps: { _count: "desc" } },
        { comments: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        coverImageUrl: true,
        createdAt: true,
        readTimeMinutes: true,
        author: { select: { name: true, avatarUrl: true } },
        categories: { select: { name: true } },
        _count: { select: { claps: true, comments: true } },
      },
    }),
  ]);
  const authorCount = authorRecords.length;

  const featuredArticles: ArticleCardProps[] = featuredArticleRecords.map((article) => {
    const plainText = stripHtml(article.content ?? "");
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: buildExcerpt(article.content ?? ""),
      author: {
        name: article.author?.name ?? "ناشناس",
        avatarUrl: article.author?.avatarUrl ?? "",
      },
      readTime: estimateReadTime(article.readTimeMinutes, plainText),
      publishDate: formatRelativeDate(article.createdAt),
      claps: article._count.claps,
      comments: article._count.comments,
      category: article.categories[0]?.name ?? "عمومی",
      image: article.coverImageUrl ?? undefined,
    };
  });

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-journal-cream via-background to-journal-cream/50">
        <Script id="organization-jsonld" type="application/ld+json">
          {JSON.stringify(organizationJsonLd())}
        </Script>
        <Script id="website-jsonld" type="application/ld+json">
          {JSON.stringify(webSiteJsonLd())}
        </Script>
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
              در مجله روانک، نویسندگان و خوانندگان فارسی‌زبان دور هم جمع می‌شوند تا
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
                {persianNumberFormatter.format(articleCount)}
              </div>
              <p className="text-journal-light">مقاله منتشر شده</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">
                {persianNumberFormatter.format(authorCount)}
              </div>
              <p className="text-journal-light">نویسنده فعال</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">
                {persianNumberFormatter.format(dailyReadersCount)}
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
                  slug={article.slug}
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
              <div className="rounded-2xl border border-dashed border-journal-orange/60 p-8 text-center text-journal-light">
                هنوز مقاله‌ای برای نمایش در این بخش وجود ندارد. به زودی با اولین مقالات تاییدشده تکمیل می‌شود.
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
              <h2 className="text-2xl font-bold text-journal sm:text-3xl">سری‌های داستانی روانک</h2>
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
