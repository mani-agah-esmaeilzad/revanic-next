// src/app/articles/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Share2 } from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import { CommentsSection } from "@/components/CommentsSection";
import { FollowButton } from "@/components/FollowButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import Image from "next/image";

interface JwtPayload {
  userId: number;
}

const ArticleDetailPage = async ({ params }: { params: { id: string } }) => {
  const articleId = parseInt(params.id, 10);

  if (isNaN(articleId)) {
    notFound();
  }
  
  // --- ثبت بازدید مقاله ---
  // این کار را به صورت non-blocking انجام می‌دهیم تا رندر صفحه را کند نکند
  prisma.articleView.create({
      data: {
          articleId: articleId
      }
  }).catch(console.error); // در صورت بروز خطا، فقط در کنسول لاگ می‌اندازیم
  
  // دریافت اطلاعات مقاله
  const article = await prisma.article.findUnique({
    where: { id: articleId, status: 'APPROVED' },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true, views: true } },
    },
  });

  if (!article) {
    notFound();
  }

  // بررسی وضعیت کاربر (لاگین کرده یا نه)
  let currentUserId: number | null = null;
  let userLikedArticle = false;
  let userIsFollowingAuthor = false;
  let userBookmarkedArticle = false;

  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      currentUserId = payload.userId as number;

      if (currentUserId) {
        // چک کردن لایک، فالو و بوکمارک
        const [like, follow, bookmark] = await Promise.all([
          prisma.like.findUnique({ where: { userId_articleId: { userId: currentUserId, articleId: article.id } } }),
          prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: article.author.id } } }),
          prisma.bookmark.findUnique({ where: { userId_articleId: { userId: currentUserId, articleId: article.id } } })
        ]);
        userLikedArticle = !!like;
        userIsFollowingAuthor = !!follow;
        userBookmarkedArticle = !!bookmark;
      }
    } catch (e) {
      console.error("Token verification failed:", e);
    }
  }

  const isOwnProfile = currentUserId === article.author.id;

  return (
    <article className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">

          {/* تصویر شاخص */}
          {article.coverImageUrl && (
            <div className="relative w-full h-64 md:h-80 mb-8 rounded-lg overflow-hidden">
                <Image
                    src={article.coverImageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
          )}

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-journal mb-6 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href={`/authors/${article.author.id}`}>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-journal-green text-white font-bold">
                      {article.author.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    href={`/authors/${article.author.id}`}
                    className="font-bold text-journal hover:text-journal-green transition-colors"
                  >
                    {article.author.name}
                  </Link>
                  <div className="text-sm text-journal-light mt-1">
                    <span>
                      {new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                    </span>
                    <span className="mx-2">·</span>
                    <span>
                      {Math.ceil(article.content.length / 1000)} دقیقه مطالعه
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LikeButton
                  articleId={article.id}
                  initialLikes={article._count.likes}
                  initialLiked={userLikedArticle}
                />
                <Button variant="outline">
                  <Share2 className="h-5 w-5 text-journal-light" />
                </Button>
                <BookmarkButton
                    articleId={article.id}
                    initialBookmarked={userBookmarkedArticle}
                />
              </div>
            </div>
          </header>

          {/* محتوای مقاله */}
          <div
            className="prose dark:prose-invert max-w-none text-journal-light mb-12"
            style={{ lineHeight: "1.8", fontSize: "1.1rem" }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* کارت نویسنده */}
          <Card className="my-12 shadow-soft border-0">
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-journal-green text-white font-bold text-xl">
                    {article.author.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-journal mb-2">
                    {article.author.name}
                  </h3>
                  <p className="text-sm text-journal-light">{article.author.bio}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/authors/${article.author.id}`}>
                    <Button variant="outline" size="sm">
                      مشاهده پروفایل
                    </Button>
                  </Link>
                  {!isOwnProfile && token && (
                    <FollowButton
                      targetUserId={article.author.id}
                      initialFollowing={userIsFollowingAuthor}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بخش کامنت‌ها */}
          <Card className="shadow-soft border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="h-5 w-5 text-journal-green" />
                <h3 className="text-xl font-bold text-journal">
                  نظرات ({article._count.comments})
                </h3>
              </div>
              <CommentsSection
                articleId={article.id}
                isUserLoggedIn={!!token}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </article>
  );
};

export default ArticleDetailPage;