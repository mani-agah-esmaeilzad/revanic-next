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

interface JwtPayload extends JWTPayload {
  userId: number;
}

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
  const articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/articles/${article.id}`;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          <main className="col-span-12 lg:col-span-8">
            <article>
              <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <Link href={`/authors/${article.author.id}`}>
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={article.author.avatarUrl || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-bold text-lg">
                        {article.author.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link href={`/authors/${article.author.id}`} className="font-bold text-foreground hover:text-primary">
                      {article.author.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{publishDate}</p>
                  </div>
                </div>
                <h1 className="text-4xl font-extrabold text-foreground leading-tight mb-4">
                  {article.title}
                </h1>
                {article.coverImageUrl && (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden my-6">
                    <Image
                      src={article.coverImageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ClapButton
                    articleId={article.id}
                    initialTotalClaps={totalClaps}
                    initialUserClaps={userClap?.count || 0}
                  />
                  <BookmarkButton
                    articleId={article.id}
                    initialBookmarked={userHasBookmarked}
                  />
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">درباره نویسنده</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center">
                    <Link href={`/authors/${article.author.id}`}>
                      <Avatar className="h-20 w-20 mb-4 border-2">
                         <AvatarImage src={article.author.avatarUrl || ''} />
                         <AvatarFallback className="bg-muted text-muted-foreground font-bold text-2xl">
                           {article.author.name?.charAt(0) || "A"}
                         </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link href={`/authors/${article.author.id}`} className="font-bold text-lg text-foreground hover:text-primary">
                      {article.author.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      {article.author.bio || "بیوگرافی نویسنده"}
                    </p>
                    {currentUserId && currentUserId !== article.authorId && (
                       <FollowButton 
                         targetUserId={article.author.id} 
                         initialFollowing={userIsFollowingAuthor} 
                       />
                    )}
                  </div>
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