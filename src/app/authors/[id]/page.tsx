import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import ArticleCard from "@/components/ArticleCard";
import { FollowButton } from "@/components/FollowButton";

interface JwtPayload {
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
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { likes: true, comments: true } },
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
            <Card className="mb-8 shadow-soft border-0">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="h-32 w-32 mb-4 md:mb-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-journal-green text-white font-bold text-4xl">
                      {author.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center md:text-right">
                    <h1 className="text-3xl font-bold text-journal mb-2">{author.name}</h1>
                    <div className="flex justify-center md:justify-start gap-6 text-journal-light mb-4">
                      <div className="text-center">
                        <div className="font-bold text-lg text-journal">{author.articles.length}</div>
                        <div>مقاله</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-journal">{author._count.followers}</div>
                        <div>دنبال‌کننده</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-journal">{author._count.following}</div>
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

            <h2 className="text-2xl font-bold text-journal mb-6">مقالات منتشر شده توسط {author.name}</h2>
            <div className="grid grid-cols-1 gap-6">
              {author.articles.length > 0 ? (
                author.articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    id={article.id.toString()}
                    title={article.title}
                    excerpt={article.content.substring(0, 200) + '...'}
                    author={{ name: author.name || 'ناشناس' }}
                    readTime={Math.ceil(article.content.length / 1000)}
                    publishDate={new Intl.DateTimeFormat('fa-IR').format(article.createdAt)}
                    likes={article._count.likes}
                    comments={article._count.comments}
                    category={article.categories[0]?.name || 'عمومی'}
                  />
                ))
              ) : (
                <p className="text-center text-journal-light py-8">این نویسنده هنوز مقاله‌ای منتشر نکرده است.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorProfilePage;
