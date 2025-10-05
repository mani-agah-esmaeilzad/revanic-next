// src/app/articles/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify, JWTPayload } from "jose";

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
import { Clock, Eye, MessageCircle, Sparkles } from "lucide-react";

interface JwtPayload extends JWTPayload {
  userId: number;
}

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildExcerpt = (html: string, limit = 140) => {
  const text = stripHtml(html);
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
};

const ArticlePage = async ({ params }: { params: { id: string } }) => {
  const articleId = parseInt(params.id, 10);
  if (isNaN(articleId)) {
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

  const article = await prisma.article.findUnique({
    where: { id: articleId, status: "APPROVED" },
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
        create: { userId: currentUserId, articleId: article.id },
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
  const formattedClaps = totalClaps.toLocaleString("fa-IR");
  const formattedComments = article._count.comments.toLocaleString("fa-IR");
  const formattedViews = article._count.views.toLocaleString("fa-IR");
  const readTimeLabel = estimatedReadTime.toLocaleString("fa-IR");
  const heroExcerpt = buildExcerpt(article.content, 220);
  const articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/articles/${article.id}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-journal-cream via-background to-background">
      <div className="pointer-events-none absolute inset-x-0 top-[-10rem] h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <main className="space-y-10">
            <article className="overflow-hidden rounded-3xl border border-border/40 bg-background/95 shadow-xl backdrop-blur">
              <header className="relative">
                <div className="relative h-[320px] w-full overflow-hidden">
                  {article.coverImageUrl ? (
                    <>
                      <Image
                        src={article.coverImageUrl}
                        alt={article.title}
                        fill
                        priority
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-journal-green/25 via-journal-cream/40 to-transparent" />
                  )}
                </div>
                <div className="relative -mt-24 px-6 pb-10 sm:px-12">
                  <div className="rounded-3xl border border-border/50 bg-background/95 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-xl sm:p-8">
                    <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                      <Link href="/" className="transition hover:text-primary">خانه</Link>
                      <span>·</span>
                      <Link href="/articles" className="transition hover:text-primary">مقالات</Link>
                      {primaryCategory ? (
                        <>
                          <span>·</span>
                          <Link
                            href={`/articles?category=${encodeURIComponent(primaryCategory)}`}
                            className="transition hover:text-primary"
                          >
                            {primaryCategory}
                          </Link>
                        </>
                      ) : null}
                    </nav>

                    {(primaryCategory || secondaryCategories.length > 0) && (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {primaryCategory ? (
                          <Badge variant="outline" className="rounded-full border-journal-green/40 bg-journal-cream/40 text-journal">
                            {primaryCategory}
                          </Badge>
                        ) : null}
                        {secondaryCategories.map((name) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="rounded-full border-border/40 bg-muted/30 text-muted-foreground"
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <h1 className="text-3xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                      {article.title}
                    </h1>
                    {heroExcerpt && (
                      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {heroExcerpt}
                      </p>
                    )}

                    <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <Link
                        href={`/authors/${article.author.id}`}
                        className="flex items-center gap-3 rounded-full bg-muted/40 px-4 py-2 text-sm text-foreground transition hover:bg-muted/70"
                      >
                        <Avatar className="h-12 w-12 border border-border/30 shadow-sm">
                          <AvatarImage src={article.author.avatarUrl || ""} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                            {article.author.name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-right">
                          <span className="block font-semibold text-foreground">{article.author.name}</span>
                          <span className="text-xs text-muted-foreground">{publishDate}</span>
                        </div>
                      </Link>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                        <div className="flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                          <Clock className="h-4 w-4 text-journal-green" />
                          {readTimeLabel} دقیقه مطالعه
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                          <Eye className="h-4 w-4 text-journal-green" />
                          {formattedViews} بازدید
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="px-6 pb-12 sm:px-12">
                <ArticleContent content={article.content} articleId={article.id} />

                {tagNames.length > 0 && (
                  <div className="mt-10 space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground">برچسب‌ها</h2>
                    <div className="flex flex-wrap gap-2">
                      {tagNames.map((tag) => (
                        <Link key={tag} href={`/tags/${tag}`}>
                          <Badge variant="secondary" className="rounded-full border border-transparent bg-journal-cream/40 px-3 py-1 text-journal">
                            #{tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 flex flex-col gap-6 rounded-2xl border border-border/60 bg-muted/10 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-4">
                    <span className="text-sm font-medium text-muted-foreground">با مقاله تعامل کنید</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <ClapButton
                        articleId={article.id}
                        initialTotalClaps={totalClaps}
                        initialUserClaps={userClap?.count || 0}
                      />
                      <BookmarkButton articleId={article.id} initialBookmarked={userHasBookmarked} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:text-sm">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Sparkles className="h-4 w-4 text-journal-orange" />
                        {formattedClaps} تشویق
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4 text-journal-green" />
                        {formattedComments} گفتگو
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ShareButton title={article.title} url={articleUrl} />
                  </div>
                </div>

                <div className="mt-12 rounded-3xl border border-border/60 bg-background/85 p-6 shadow-inner sm:p-8">
                  <CommentsSection
                    articleId={article.id}
                    initialComments={article.comments}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            </article>
          </main>

          <aside className="space-y-6 lg:space-y-8">
            <Card className="border-border/40 bg-background/95 shadow-lg backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">درباره نویسنده</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center text-center">
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
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
