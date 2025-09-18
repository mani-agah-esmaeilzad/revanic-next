// src/app/tags/[name]/page.tsx
'use client';
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface FetchedArticle {
    id: number;
    title: string;
    content: string;
    coverImageUrl: string | null;
    author: { name: string | null };
    createdAt: string;
    _count: { likes: number; comments: number };
    categories: { name: string }[];
}

interface PaginationInfo {
    page: number;
    totalPages: number;
}

const TagPage = () => {
    const params = useParams();
    const tagName = decodeURIComponent(params.name as string);
    const [articles, setArticles] = useState<FetchedArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    const fetchArticlesByTag = useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/tags/${tagName}?page=${page}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setArticles(data.articles);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch articles by tag:", error);
        } finally {
            setIsLoading(false);
        }
    }, [tagName]);

    useEffect(() => {
        if (tagName) {
            fetchArticlesByTag(1);
        }
    }, [fetchArticlesByTag, tagName]);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
            fetchArticlesByTag(newPage);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <section className="py-16 bg-journal-cream/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <p className="text-lg text-journal-light mb-2">مقالات مرتبط با</p>
                        <h1 className="text-4xl font-bold text-journal">
                            #{tagName}
                        </h1>
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {isLoading ? (
                            <div className="space-y-6">
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        ) : articles.length > 0 ? (
                            <>
                                <div className="space-y-6">
                                    {articles.map((article) => (
                                        <ArticleCard
                                            key={article.id}
                                            id={article.id.toString()}
                                            title={article.title}
                                            excerpt={article.content.substring(0, 150) + "..."}
                                            author={{ name: article.author.name || "ناشناس" }}
                                            readTime={Math.ceil(article.content.length / 1000)}
                                            publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                                            likes={article._count.likes}
                                            comments={article._count.comments}
                                            category={article.categories[0]?.name || "عمومی"}
                                            image={article.coverImageUrl}
                                        />
                                    ))}
                                </div>

                                {pagination && pagination.totalPages > 1 && (
                                    <div className="mt-12">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem><PaginationPrevious onClick={() => handlePageChange(pagination.page - 1)} /></PaginationItem>
                                                {[...Array(pagination.totalPages)].map((_, i) => (
                                                    <PaginationItem key={i}><PaginationLink isActive={pagination.page === i + 1} onClick={() => handlePageChange(i + 1)}>{i + 1}</PaginationLink></PaginationItem>
                                                ))}
                                                <PaginationItem><PaginationNext onClick={() => handlePageChange(pagination.page + 1)} /></PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-journal-light text-lg">
                                    هیچ مقاله‌ای با این برچسب یافت نشد.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TagPage;