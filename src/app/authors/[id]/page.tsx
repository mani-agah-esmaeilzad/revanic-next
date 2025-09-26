// src/app/authors/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify, JWTPayload } from "jose";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import ArticleCard from "@/components/ArticleCard";
import { FollowButton } from "@/components/FollowButton";
import Link from "next/link";

// تعریف تایپ صحیح برای payload توکن
interface JwtPayload extends JWTPayload {
  userId: number;
}

const AuthorProfilePage = async ({ params }: { params: { id: string } }) => {
  const authorId = parseInt(params.id, 10);

  if (isNaN(authorId)) {
    notFound();
  }

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    include: {
      articles: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true, avatarUrl: true } }, // <-- `avatarUrl` اضافه شد
          _count: { select: { claps: true, comments: true } },
          categories: { select: { name: true } }
        }
      },
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!author) {
    notFound();
  }

  let currentUserId: number | null = null;
  let userIsFollowingAuthor = false;

  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      currentUserId = (payload as JwtPayload).userId;

      if (currentUserId) {
        const follow = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: author.id } },
        });
        userIsFollowingAuthor = !!follow;
      }
    } catch (e) {
      console.error("Token verification failed:", e);
    }
  }

  const isOwnProfile = currentUserId === author.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 shadow-sm border">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="h-32 w-32 mb-4 md:mb-0 border">
                    {/* --- تغییر اصلی در این بخش اعمال شده --- */}
                    <AvatarImage src={author.avatarUrl || ''} alt={author.name || 'Author Avatar'} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold text-4xl">
                      {author.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center md:text-right">
                    <h1 className="text-3xl font-bold text-foreground mb-2">{author.name}</h1>
                    <p className="text-muted-foreground mb-4">{author.bio}</p>
                    <div className="flex justify-center md:justify-start gap-6 text-muted-foreground mb-4">
                      <div className="text-center">
                        <div className="font-bold text-lg text-foreground">{author.articles.length}</div>
                        <div>مقاله</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-foreground">{author._count.followers}</div>
                        <div>دنبال‌کننده</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-foreground">{author._count.following}</div>
                        <div>دنبال‌شونده</div>
                      </div>
                    </div>
                    {!isOwnProfile && token && (
                      <FollowButton targetUserId={author.id} initialFollowing={userIsFollowingAuthor} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold text-foreground mb-6">مقالات منتشر شده توسط {author.name}</h2>
            <div className="space-y-6">
              {author.articles.length > 0 ? (
                author.articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    id={article.id.toString()}
                    title={article.title}
                    excerpt={article.content.substring(0, 200).replace(/<[^>]*>?/gm, '') + '...'}
                    author={{ name: article.author.name || 'ناشناس', avatar: article.author.avatarUrl || undefined }} // <-- `avatarUrl` پاس داده شد
                    readTime={Math.ceil(article.content.length / 1000)}
                    publishDate={new Intl.DateTimeFormat('fa-IR').format(article.createdAt)}
                    claps={article._count.claps}
                    comments={article._count.comments}
                    category={article.categories[0]?.name || 'عمومی'}
                    image={article.coverImageUrl}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">این نویسنده هنوز مقاله‌ای منتشر نکرده است.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorProfilePage;