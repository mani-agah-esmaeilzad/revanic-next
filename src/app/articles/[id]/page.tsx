import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { ClapButton } from "@/components/ClapButton";
import { CommentsSection } from "@/components/CommentsSection";
import { FollowButton } from "@/components/FollowButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ArticleContent } from '@/components/ArticleContent'; // کامپوننت جدید برای نمایش محتوا و هایلایت
import { ShareButton } from "@/components/ShareButton"; // کامپوننت جدید اشتراک‌گذاری
import { Button } from "@/components/ui/button";

interface JwtPayload {
  userId: number;
}

// آدرس پایه سایت را از متغیرهای محیطی می‌خوانیم
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const ArticleDetailPage = async ({ params }: { params: { id: string } }) => {
  const articleId = parseInt(params.id, 10);

  if (isNaN(articleId)) {
    notFound();
  }

  // ثبت بازدید مقاله (به صورت غیرمسدودکننده)
  prisma.articleView.create({
    data: { articleId: articleId }
  }).catch(console.error);

  // دریافت اطلاعات کامل مقاله از دیتابیس
  const article = await prisma.article.findUnique({
    where: { id: articleId, status: 'APPROVED' },
    include: {
      author: true,
      claps: true, // دریافت اطلاعات کامل تشویق‌ها برای محاسبه مجموع
      _count: { select: { comments: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!article) {
    notFound();
  }

  // محاسبه مجموع کل تشویق‌ها
  const totalClaps = article.claps.reduce((sum, clap) => sum + clap.count, 0);
  const articleUrl = `${baseUrl}/articles/${article.id}`; // ساخت URL کامل مقاله برای اشتراک‌گذاری

  // بررسی وضعیت کاربر فعلی (لاگین کرده یا نه)
  let currentUserId: number | null = null;
  let userClaps = 0;
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
        // پیدا کردن تعداد تشویق‌های کاربر فعلی
        const userClap = article.claps.find(c => c.userId === currentUserId);
        userClaps = userClap ? userClap.count : 0;

        // بررسی وضعیت فالو و بوکمارک به صورت همزمان
        const [follow, bookmark] = await Promise.all([
          prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: article.author.id } } }),
          prisma.bookmark.findUnique({ where: { userId_articleId: { userId: currentUserId, articleId: article.id } } })
        ]);
        userIsFollowingAuthor = !!follow;
        userBookmarkedArticle = !!bookmark;
      }
    } catch (e) {
      console.error("Token verification failed:", e);
    }
  }

  const isOwnProfile = currentUserId === article.author.id;

  return (
    <article className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">

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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href={`/authors/${article.author.id}`}>
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                      {article.author.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    href={`/authors/${article.author.id}`}
                    className="font-bold text-foreground hover:text-primary transition-colors"
                  >
                    {article.author.name}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1">
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
                <ClapButton
                  articleId={article.id}
                  initialTotalClaps={totalClaps}
                  initialUserClaps={userClaps}
                />
                <ShareButton
                  title={article.title}
                  url={articleUrl}
                />
                <BookmarkButton
                  articleId={article.id}
                  initialBookmarked={userBookmarkedArticle}
                />
              </div>
            </div>
          </header>

          {/* استفاده از کامپوننت جدید برای نمایش محتوا و فعال‌سازی هایلایت */}
          <ArticleContent articleId={article.id} content={article.content} />

          {/* بخش نمایش برچسب‌ها */}
          {article.tags.length > 0 && (
            <div className="my-12">
              <div className="flex flex-wrap gap-2">
                {article.tags.map(({ tag }) => (
                  <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      # {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* کارت نویسنده */}
          <Card className="my-12 shadow-sm border">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xl">
                    {article.author.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-right">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {article.author.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{article.author.bio}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
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
          <Card className="shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">
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
