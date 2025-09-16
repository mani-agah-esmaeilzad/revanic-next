// src/components/AdminArticlesTab.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Trash2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

type ArticleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Article {
    id: number;
    title: string;
    status: ArticleStatus;
    createdAt: string;
    author: {
        name: string | null;
        email: string;
    };
    _count: {
        likes: number;
        comments: number;
    };
}

interface PaginationInfo {
    page: number;
    totalPages: number;
}

export const AdminArticlesTab = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);


    const fetchArticles = useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/articles?page=${page}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setArticles(data.articles);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch articles:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArticles(1);
    }, [fetchArticles]);

    const handleStatusChange = async (articleId: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            const response = await fetch(`/api/admin/articles/${articleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (response.ok) {
                fetchArticles(pagination?.page || 1);
            } else {
                alert(`خطا در تغییر وضعیت مقاله.`);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDeleteArticle = async (articleId: number) => {
        if (!window.confirm(`آیا از حذف مقاله با شناسه ${articleId} اطمینان دارید؟`)) {
            return;
        }
        try {
            const response = await fetch('/api/admin/articles', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: articleId }),
            });
            if (response.ok) {
                fetchArticles(pagination?.page || 1);
            } else {
                alert('خطا در حذف مقاله.');
            }
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
    };

    const getStatusBadge = (status: ArticleStatus) => {
        switch (status) {
            case 'APPROVED':
                return <Badge variant="default" className="bg-green-500">تایید شده</Badge>;
            case 'PENDING':
                return <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">در انتظار</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">رد شده</Badge>;
            default:
                return <Badge variant="outline">نامشخص</Badge>;
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
            fetchArticles(newPage);
        }
    };

    if (isLoading) {
        return <div className="space-y-2 mt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    }

    return (
        <>
            <div className="rounded-lg border mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>عنوان</TableHead>
                            <TableHead>نویسنده</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead>تاریخ</TableHead>
                            <TableHead>عملیات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {articles.map((article) => (
                            <TableRow key={article.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/articles/${article.id}`} className="hover:underline" target="_blank">
                                        {article.title}
                                    </Link>
                                </TableCell>
                                <TableCell>{article.author.name} ({article.author.email})</TableCell>
                                <TableCell>{getStatusBadge(article.status)}</TableCell>
                                <TableCell>
                                    {new Intl.DateTimeFormat('fa-IR').format(new Date(article.createdAt))}
                                </TableCell>
                                <TableCell className="flex gap-1">
                                    {article.status === 'PENDING' && (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(article.id, 'APPROVED')}>
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(article.id, 'REJECTED')}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteArticle(article.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious onClick={() => handlePageChange(pagination.page - 1)} />
                            </PaginationItem>
                            {[...Array(pagination.totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        isActive={pagination.page === i + 1}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext onClick={() => handlePageChange(pagination.page + 1)} />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </>
    );
};