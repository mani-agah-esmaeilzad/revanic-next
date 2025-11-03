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
import { Pin } from "lucide-react";
import type { Metadata } from "next";
import Script from "next/script";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { buildCanonical, getDeploymentUrl, personJsonLd, breadcrumbJsonLd } from "@/lib/seo";

interface JwtPayload extends JWTPayload {
  userId: number;
}

const toPlainText = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const authorId = Number(params.id);
  if (Number.isNaN(authorId)) {
    return {
      title: "پروفایل نویسنده | روانک",
      description: "پروفایل نویسنده در روانک.",
    };
  }

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: {
      name: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!author) {
    return {
      title: "نویسنده یافت نشد | روانک",
      description: "پروفایل نویسنده مورد نظر در روانک موجود نیست.",
    };
  }

  const canonical = buildCanonical(`/authors/${authorId}`);
  const description = author.bio?.slice(0, 160) || `${author.name ?? "نویسنده"} در روانک فعال است.`;

  return {
    title: `${author.name ?? "نویسنده"} | روانک`,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: `${author.name ?? "نویسنده"} | روانک`,
      description,
      url: canonical,
      type: "profile",
      images: author.avatarUrl ? [{ url: author.avatarUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: author.name ?? "نویسنده روانک",
      description,
    },
  };
}

const AuthorProfilePage = async ({ params }: { params: { id: string } }) => {
  const authorId = parseInt(params.id, 10);
  if (isNaN(authorId)) {
    notFound();
  }

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    include: {
      pinnedArticle: {
        include: {
          author: { select: { name: true, avatarUrl: true } },
          _count: { select: { claps: true, comments: true } },
          categories: { select: { name: true } },
        },
      },
      articles: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true, avatarUrl: true } },
          _count: { select: { claps: true, comments: true } },
          categories: { select: { name: true } },
        },
      },
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!author) {
    notFound();
  }

  const otherArticles = author.pinnedArticle
    ? author.articles.filter(article => article.id !== author.pinnedArticleId)
    : author.articles;

  let currentUserId: number | null = null;
  let userIsFollowingAuthor = false;
  const token = cookies().get("token")?.value;

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

  const siteUrl = getDeploymentUrl();
  const canonical = buildCanonical(`/authors/${author.id}`);
  const profileUrl = canonical || (siteUrl ? `${siteUrl}/authors/${author.id}` : `/authors/${author.id}`);
  const personSchema = personJsonLd({
    name: author.name ?? "نویسنده روانک",
    url: profileUrl,
    image: author.avatarUrl,
    description: author.bio ? toPlainText(author.bio) : undefined,
  });
  const breadcrumbData = breadcrumbJsonLd([
    { name: "خانه", url: siteUrl ? `${siteUrl}/` : "/" },
    { name: "نویسندگان", url: siteUrl ? `${siteUrl}/authors` : "/authors" },
    { name: author.name ?? "نویسنده", url: profileUrl },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Script id="author-person-jsonld" type="application/ld+json">
            {JSON.stringify(personSchema)}
          </Script>
          <Script id="author-breadcrumb-jsonld" type="application/ld+json">
            {JSON.stringify(breadcrumbData)}
          </Script>
          <div className="max-w-4xl mx-auto">
            <Breadcrumb className="mb-6 text-sm text-muted-foreground">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">خانه</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/authors">نویسندگان</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{author.name ?? "نویسنده"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Card className="mb-8 shadow-sm border">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="h-32 w-32 mb-4 md:mb-0 border">
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

            {author.pinnedArticle && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                  <Pin className="h-5 w-5" />
                  مقاله پین شده
                </h2>
                <ArticleCard
                  key={author.pinnedArticle.id}
                  id={author.pinnedArticle.id.toString()}
                  slug={author.pinnedArticle.slug}
                  title={author.pinnedArticle.title}
                  excerpt={author.pinnedArticle.content.substring(0, 200).replace(/<[^>]*>?/gm, '') + '...'}
                  author={{ name: author.pinnedArticle.author.name || 'ناشناس', avatar: author.pinnedArticle.author.avatarUrl || undefined }}
                  readTime={Math.ceil(author.pinnedArticle.content.length / 1000)}
                  publishDate={new Intl.DateTimeFormat('fa-IR').format(new Date(author.pinnedArticle.createdAt))}
                  claps={author.pinnedArticle._count.claps}
                  comments={author.pinnedArticle._count.comments}
                  category={author.pinnedArticle.categories[0]?.name || 'عمومی'}
                  image={author.pinnedArticle.coverImageUrl}
                />
              </div>
            )}

            <h2 className="text-2xl font-bold text-foreground mb-6">
              {author.pinnedArticle ? 'سایر مقالات' : 'مقالات منتشر شده توسط'} {author.name}
            </h2>
            <div className="space-y-6">
              {otherArticles.length > 0 ? (
                otherArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    id={article.id.toString()}
                    slug={article.slug}
                    title={article.title}
                    excerpt={article.content.substring(0, 200).replace(/<[^>]*>?/gm, '') + '...'}
                    author={{ name: article.author.name || 'ناشناس', avatar: article.author.avatarUrl || undefined }}
                    readTime={Math.ceil(article.content.length / 1000)}
                    publishDate={new Intl.DateTimeFormat('fa-IR').format(new Date(article.createdAt))}
                    claps={article._count.claps}
                    comments={article._count.comments}
                    category={article.categories[0]?.name || 'عمومی'}
                    image={article.coverImageUrl}
                  />
                ))
              ) : (
                 author.pinnedArticle ? null : <p className="text-center text-muted-foreground py-8">این نویسنده هنوز مقاله‌ای منتشر نکرده است.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorProfilePage;