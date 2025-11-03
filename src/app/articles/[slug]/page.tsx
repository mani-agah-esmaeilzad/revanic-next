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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { articleJsonLd, breadcrumbJsonLd, buildCanonical, getDeploymentUrl } from "@/lib/seo";

interface JwtPayload extends JWTPayload {
  userId: number;
}

const toPlainText = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const buildExcerpt = (content: string, limit = 180) => {
  const text = stripHtml(content);
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}...` : text;
};

const formatCount = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value < 0 ? 0 : value);

const normalizeSlug = (value: string) => {
  if (!value) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = normalizeSlug(params.slug);
  const article = await prisma.article.findFirst({
    where: { slug, status: "APPROVED" },
    select: {
      slug: true,
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
      title: "مقاله یافت نشد | روانک",
      description: "مقاله مورد نظر شما در روانک پیدا نشد.",
    };
  }

  const description = toPlainText(article.content).slice(0, 160) || article.title;
  const canonical = buildCanonical(`/articles/${article.slug}`);

  return {
    title: `${article.title} | روانک`,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: `${article.title} | روانک`,
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
  const slug = normalizeSlug(params.slug);
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
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      _count: {
        select: {
          claps: true,
          comments: true,
          views: true,
        },
      },
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

  const updatePromises = [prisma.articleView.create({ data: { articleId: article.id } })];

  if (currentUserId) {
    updatePromises.push(
      prisma.readingHistory.upsert({
        where: { userId_articleId: { userId: currentUserId, articleId: article.id } },
        update: {},
        create: { userId: currentUserId, articleId: article.id, progress: readingProgress },
      }),
    );
  }

  await Promise.all(updatePromises);

  const userClap = currentUserId ? article.claps.find((c) => c.userId === currentUserId) : null;
  const userHasBookmarked = currentUserId
    ? article.bookmarks.some((b) => b.userId === currentUserId)
    : false;
  const userIsFollowingAuthor = currentUserId
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentUserId, followingId: article.authorId } },
      }))
    : false;

  const relatedArticles = await prisma.article.findMany({
    where: {
      status: "APPROVED",
      id: { not: article.id },
      categories: { some: { id: { in: article.categories.map((c) => c.id) } } },
    },
    take: 3,
    include: {
      author: { select: { name: true, avatarUrl: true } },
      categories: { select: { name: true } },
      _count: { select: { claps: true, comments: true } },
    },
  });

  const publishDate = new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(
    new Date(article.createdAt),
  );

  const totalClaps = article.claps.reduce((sum, clap) => sum + clap.count, 0);
  const formattedViews = formatCount(article._count.views ?? 0);
  const formattedComments = formatCount(article._count.comments ?? 0);
  const formattedClaps = formatCount(totalClaps);

  const siteUrl = getDeploymentUrl();
  const canonical = buildCanonical(`/articles/${article.slug}`);
  const articleUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/articles/${article.slug}`
    : `/articles/${article.slug}`;
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

  const readingProgressLabel =
    readingProgress > 0 ? `${Math.min(100, Math.round(readingProgress))}%` : "شروع نشده";

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
              <header className="mb-10 space-y-6">
                <Breadcrumb className="text-sm text-muted-foreground">
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

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Link href={`/authors/${article.author.id}`}>
                      <Avatar className="h-16 w-16 border-2 border-journal-green/40 shadow-md">
                        <AvatarImage src={article.author.avatarUrl || ""} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xl">
                          {article.author.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="space-y-1">
                      <Link
                        href={`/authors/${article.author.id}`}
                        className="text-lg font-semibold text-foreground transition hover:text-primary"
                      >
                        {article.author.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{publishDate}</p>
                    </div>
                  </div>
                  {currentUserId && currentUserId !== article.authorId ? (
                    <FollowButton
                      targetUserId={article.author.id}
                      initialFollowing={userIsFollowingAuthor}
                    />
                  ) : null}
                </div>

                <h1 className="text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
                  {article.title}
                </h1>

                {article.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {article.categories.map((category) => (
                      <Badge key={category.id} variant="outline" className="text-sm">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {article.coverImageUrl ? (
                  <div className="relative h-64 w-full overflow-hidden rounded-xl md:h-96">
                    <Image
                      src={article.coverImageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : null}

                <div className="grid gap-4 rounded-lg border border-border/50 bg-card/60 p-4 text-center text-xs text-muted-foreground sm:grid-cols-3 sm:text-sm">
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
              </header>

              <ArticleContent content={article.content} articleId={article.id} />

              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map(({ tag }) => (
                  <Link href={`/tags/${tag.name}`} key={tag.id}>
                    <Badge variant="secondary"># {tag.name}</Badge>
                  </Link>
                ))}
              </div>

              <Separator className="my-8" />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ClapButton
                    articleId={article.id}
                    initialTotalClaps={totalClaps}
                    initialUserClaps={userClap?.count || 0}
                  />
                  <BookmarkButton articleId={article.id} initialBookmarked={userHasBookmarked} />
                </div>
                <ShareButton title={article.title} url={articleUrl} />
              </div>

              <Separator className="my-8" />

              <CommentsSection
                articleId={article.id}
                initialComments={article.comments}
                currentUserId={currentUserId}
              />
            </article>
          </main>

          <aside className="col-span-12 lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">درباره نویسنده</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Link href={`/authors/${article.author.id}`}>
                      <Avatar className="h-24 w-24 border-2 border-journal-green/40 shadow-md">
                        <AvatarImage src={article.author.avatarUrl || ""} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
                          {article.author.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="space-y-2">
                      <Link
                        href={`/authors/${article.author.id}`}
                        className="text-lg font-semibold text-foreground transition hover:text-primary"
                      >
                        {article.author.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {article.author.bio || "این نویسنده هنوز توضیحی درباره خود ننوشته است."}
                      </p>
                    </div>
                    {currentUserId && currentUserId !== article.authorId ? (
                      <FollowButton
                        targetUserId={article.author.id}
                        initialFollowing={userIsFollowingAuthor}
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">جزئیات مطالعه</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">زمان مطالعه</span>
                    <span>{new Intl.NumberFormat("fa-IR").format(estimatedReadTime)} دقیقه</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">پیشرفت شما</span>
                    <span>{readingProgressLabel}</span>
                  </div>
                  {article.categories.length > 0 ? (
                    <div>
                      <span className="font-medium text-foreground">دسته‌بندی‌ها</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {article.categories.map((category) => (
                          <Badge key={category.id} variant="secondary">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {relatedArticles.length > 0 ? (
                <Card className="border-border/50 bg-card/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">مقالات مشابه</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedArticles.map((related) => {
                      const relatedPlainText = stripHtml(related.content ?? "");
                      const relatedReadTime =
                        related.readTimeMinutes && related.readTimeMinutes > 0
                          ? related.readTimeMinutes
                          : Math.max(
                              1,
                              Math.round(relatedPlainText.split(/\s+/).filter(Boolean).length / 200),
                            );
                      return (
                        <ArticleCard
                          key={related.id}
                          id={related.id.toString()}
                          slug={related.slug}
                          title={related.title}
                          excerpt={buildExcerpt(related.content, 130)}
                          author={{ name: related.author.name || "", avatar: related.author.avatarUrl || undefined }}
                          readTime={relatedReadTime}
                          publishDate={new Intl.DateTimeFormat("fa-IR").format(
                            new Date(related.createdAt),
                          )}
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
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
