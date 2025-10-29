// src/app/articles/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify, JWTPayload } from "jose";
import type { Metadata } from "next";
import Script from "next/script";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import ArticleCard from "@/components/ArticleCard";
import { ArticleContent } from "@/components/ArticleContent";
import { ClapButton } from "@/components/ClapButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CommentsSection } from "@/components/CommentsSection";
import { ShareButton } from "@/components/ShareButton";
import { FollowButton } from "@/components/FollowButton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { articleJsonLd, breadcrumbJsonLd, buildCanonical, getDeploymentUrl } from "@/lib/seo";

interface JwtPayload extends JWTPayload {
  userId: number;
}

const toPlainText = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await prisma.article.findFirst({
    where: { slug: params.slug, status: "APPROVED" },
    select: {
      title: true,
      content: true,
      coverImageUrl: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });

  if (!article) {
    return {
      title: "مقاله یافت نشد | روانیک",
      description: "مقاله مورد نظر شما در روانیک پیدا نشد.",
    };
  }

  const description = toPlainText(article.content).slice(0, 160) || article.title;
  const canonical = buildCanonical(`/articles/${params.slug}`);

  return {
    title: `${article.title} | روانیک`,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: `${article.title} | روانیک`,
      description,
      type: "article",
      url: canonical,
      images: article.coverImageUrl ? [{ url: article.coverImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
    },
  };
}

const ArticlePage = async ({ params }: { params: { slug: string } }) => {
  const { slug } = params;
  if (!slug) {
    notFound();
  }

  let currentUserId: number | null = null;
  const token = cookies().get("token")?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      currentUserId = (payload as JwtPayload).userId;
    } catch (e) {
      console.error("Token verification failed on article page:", e);
    }
  }

  const article = await prisma.article.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      author: true,
      categories: true,
      tags: { include: { tag: true } },
      claps: true,
      bookmarks: true,
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } }
      },
      _count: {
        select: {
          claps: true,
          comments: true,
          views: true
        }
      }
    },
  });

  if (!article) {
    notFound();
  }

  let readingProgress = 0;
  if (currentUserId) {
    const historyRecord = await prisma.readingHistory.findUnique({
      where: { userId_articleId: { userId: currentUserId, articleId: article.id } },
      select: { progress: true },
    });
    readingProgress = historyRecord?.progress ?? 0;
  }

  const plainTextContent = stripHtml(article.content);
  const estimatedReadTime =
    article.readTimeMinutes && article.readTimeMinutes > 0
      ? article.readTimeMinutes
      : Math.max(1, Math.round(plainTextContent.split(/\s+/).filter(Boolean).length / 200));
  const primaryCategory = article.categories[0]?.name;
  const secondaryCategories = article.categories.slice(1).map((category) => category.name);
  const tagNames = article.tags.map(({ tag }) => tag.name);

  // --- دو عملیات همزمان: افزایش بازدید کلی و ثبت تاریخچه مطالعه ---
  const updatePromises = [
    prisma.articleView.create({ data: { articleId: article.id } })
  ];

  if (currentUserId) {
    updatePromises.push(
      prisma.readingHistory.upsert({
        where: { userId_articleId: { userId: currentUserId, articleId: article.id } },
        update: {}, // فقط `viewedAt` به خاطر @updatedAt آپدیت می‌شود
        create: { userId: currentUserId, articleId: article.id, progress: readingProgress },
      })
    );
  }
  
  // اجرای همزمان هر دو درخواست دیتابیس
  await Promise.all(updatePromises);

  const userClap = currentUserId ? article.claps.find(c => c.userId === currentUserId) : null;
  const userHasBookmarked = currentUserId ? article.bookmarks.some(b => b.userId === currentUserId) : false;
  const userIsFollowingAuthor = currentUserId ? !!(await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: article.authorId } },
  })) : false;

  const relatedArticles = await prisma.article.findMany({
    where: {
      status: 'APPROVED',
      id: { not: article.id },
      categories: { some: { id: { in: article.categories.map(c => c.id) } } },
    },
    take: 3,
    include: {
      author: { select: { name: true, avatarUrl: true } },
      categories: { select: { name: true } },
      _count: { select: { claps: true, comments: true } }
    }
  });

  const publishDate = new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(
    new Date(article.createdAt)
  );

  const totalClaps = article.claps.reduce((sum, clap) => sum + clap.count, 0);
  const siteUrl = getDeploymentUrl();
  const canonical = buildCanonical(`/articles/${article.slug}`);
  const articleUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}/articles/${article.slug}` : `/articles/${article.slug}`;
  const articleStructuredData = articleJsonLd({
    title: article.title,
    description: toPlainText(article.content).slice(0, 180) || article.title,
    url: canonical || articleUrl,
    image: article.coverImageUrl,
    publishDate: new Date(article.createdAt).toISOString(),
    modifiedDate: new Date(article.updatedAt).toISOString(),
    authorName: article.author.name,
  });
  const breadcrumbData = breadcrumbJsonLd([
    { name: "خانه", url: siteUrl ? `${siteUrl}/` : "/" },
    { name: "مقالات", url: siteUrl ? `${siteUrl}/articles` : "/articles" },
    { name: article.title, url: canonical || articleUrl },
  ]);

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          <main className="col-span-12 lg:col-span-8">
            <article>
              <Script id="article-jsonld" type="application/ld+json">
                {JSON.stringify(articleStructuredData)}
              </Script>
              <Script id="article-breadcrumb-jsonld" type="application/ld+json">
                {JSON.stringify(breadcrumbData)}
              </Script>
              <header className="mb-8">
                <Breadcrumb className="mb-4 text-sm text-muted-foreground">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/">خانه</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/articles">مقالات</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{article.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <div className="flex items-center gap-4 mb-4">
                  <Link href={`/authors/${article.author.id}`}>
                    <Avatar className="h-20 w-20 border-2 border-journal-green/40 shadow-md">
                      <AvatarImage src={article.author.avatarUrl || ""} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-bold text-2xl">
                        {article.author.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Link
                    href={`/authors/${article.author.id}`}
                    className="mt-3 text-lg font-semibold text-foreground transition hover:text-primary"
                  >
                    {article.author.name}
                  </Link>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {article.author.bio || "این نویسنده هنوز توضیحی درباره خود ننوشته است."}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground sm:text-sm">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formattedViews}</p>
                    <p>بازدید</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{formattedComments}</p>
                    <p>گفتگو</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{formattedClaps}</p>
                    <p>تشویق</p>
                  </div>
                </div>

                {currentUserId && currentUserId !== article.authorId ? (
                  <FollowButton targetUserId={article.author.id} initialFollowing={userIsFollowingAuthor} />
                ) : null}
              </CardContent>
            </Card>

            {relatedArticles.length > 0 && (
              <Card className="border-border/40 bg-background/95 shadow-lg backdrop-blur">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">مقالات مشابه</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {relatedArticles.map((related) => {
                    const relatedReadTime =
                      related.readTimeMinutes && related.readTimeMinutes > 0
                        ? related.readTimeMinutes
                        : Math.max(
                            1,
                            Math.round(stripHtml(related.content).split(/\s+/).filter(Boolean).length / 200),
                          );
                    return (
                      <ArticleCard
                        key={related.id}
                        id={related.id.toString()}
                        title={related.title}
                        excerpt={buildExcerpt(related.content, 130)}
                        author={{ name: related.author.name || "", avatar: related.author.avatarUrl || undefined }}
                        readTime={relatedReadTime}
                        publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(related.createdAt))}
                        claps={related._count.claps}
                        comments={related._count.comments}
                        category={related.categories[0]?.name || ""}
                        image={related.coverImageUrl}
                        className="border border-border/40 bg-background/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      />
                    );
                  })}
                </CardContent>
              </Card>

              {relatedArticles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">مقالات مشابه</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedArticles.map(related => (
                       <ArticleCard
                         key={related.id}
                         id={related.id.toString()}
                         slug={related.slug}
                         title={related.title}
                         excerpt={related.content.substring(0, 100).replace(/<[^>]*>?/gm, '') + "..."}
                         author={{ name: related.author.name || '', avatar: related.author.avatarUrl }}
                         readTime={related.readTimeMinutes || 1}
                         publishDate={new Intl.DateTimeFormat('fa-IR').format(new Date(related.createdAt))}
                         claps={related._count.claps}
                         comments={related._count.comments}
                         category={related.categories[0]?.name || ''}
                       />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
