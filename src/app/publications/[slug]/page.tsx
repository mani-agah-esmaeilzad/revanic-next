// src/app/publications/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import ArticleCard from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import Link from "next/link";
import { Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const ARTICLES_PER_PAGE = 10;

interface PublicationPageProps {
    params: {
        slug: string;
    };
    searchParams: {
        page?: string;
    };
}

const PublicationPage = async ({ params, searchParams }: PublicationPageProps) => {
    const { slug } = params;
    const currentPage = Number(searchParams.page) || 1;

    let currentUserId: number | null = null;
    const token = cookies().get("token")?.value;
    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            currentUserId = payload.userId as number;
        } catch (e) { console.error("Token verification failed:", e); }
    }

    const publication = await prisma.publication.findUnique({
        where: { slug },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                },
            },
            _count: {
                select: { articles: true },
            },
        },
    });

    if (!publication) {
        notFound();
    }

    const owner = publication.members.find(member => member.role === 'OWNER');
    const isOwner = owner?.userId === currentUserId;

    const articles = await prisma.article.findMany({
        where: { publicationId: publication.id, status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * ARTICLES_PER_PAGE,
        take: ARTICLES_PER_PAGE,
        include: {
            author: { select: { name: true, avatarUrl: true } },
            categories: { select: { name: true } },
            _count: { select: { claps: true, comments: true } },
        },
    });

    const totalArticles = publication._count.articles;
    const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

    return (
        <div className="min-h-screen bg-background">
            <div className="py-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Card className="mb-8 shadow-sm border relative">
                            {isOwner && (
                                <div className="absolute top-4 left-4">
                                    <Link href={`/publications/${slug}/manage`}>
                                        <Button variant="outline" size="sm">
                                            <Settings className="ml-2 h-4 w-4" />
                                            مدیریت
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <Avatar className="h-32 w-32 mb-4 md:mb-0 border">
                                        <AvatarImage src={publication.avatarUrl || ""} alt={publication.name} />
                                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-4xl">
                                            {publication.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-center md:text-right">
                                        <h1 className="text-4xl font-bold text-foreground mb-2">
                                            {publication.name}
                                        </h1>
                                        <p className="text-muted-foreground mb-4">
                                            {publication.description}
                                        </p>
                                        <div className="flex justify-center md:justify-start items-center gap-2 text-muted-foreground text-sm">
                                            <Users className="h-4 w-4" />
                                            <span>{publication.members.length} نویسنده</span>
                                            <span className="mx-1">•</span>
                                            <span>{totalArticles} مقاله</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-3">نویسندگان نشریه</h2>
                            <div className="flex flex-wrap gap-4">
                                {publication.members.map(({ user }) => (
                                    <Link href={`/authors/${user.id}`} key={user.id} className="flex items-center gap-2 hover:bg-muted p-2 rounded-md transition-colors">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl || ''} />
                                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-foreground mb-6">
                            آخرین مقالات نشریه
                        </h2>
                        <div className="space-y-6">
                            {articles.length > 0 ? (
                                articles.map((article) => (
                                    // --- THIS IS THE FIX ---
                                    <ArticleCard
                                        key={article.id}
                                        id={article.id.toString()}
                                        title={article.title}
                                        excerpt={
                                            article.content
                                                .substring(0, 200)
                                                .replace(/<[^>]*>?/gm, "") + "..."
                                        }
                                        author={{
                                            name: article.author.name || "ناشناس",
                                            avatar: article.author.avatarUrl || undefined,
                                        }}
                                        readTime={Math.ceil(article.content.length / 1000)}
                                        publishDate={new Intl.DateTimeFormat("fa-IR").format(
                                            new Date(article.createdAt)
                                        )}
                                        claps={article._count.claps}
                                        comments={article._count.comments}
                                        category={article.categories[0]?.name || "عمومی"}
                                        image={article.coverImageUrl}
                                    />
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    این نشریه هنوز مقاله‌ای منتشر نکرده است.
                                </p>
                            )}
                        </div>

                        <div className="mt-12">
                            <Pagination totalPages={totalPages} currentPage={currentPage} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicationPage;