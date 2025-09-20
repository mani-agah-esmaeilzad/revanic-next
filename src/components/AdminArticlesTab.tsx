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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // <-- ایمپورت‌های جدید

// =======================================================================
//  1. تعریف تایپ‌ها (Types)
// =======================================================================
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
        claps: number; // <-- *** مهم: از likes به claps تغییر کرد ***
        comments: number;
    };
}

interface PaginationInfo {
    page: number;
    totalPages: number;
}

interface ApiResponse {
    articles: Article[];
    pagination: PaginationInfo;
}

// =======================================================================
//  2. توابع ارتباط با API (API Functions)
// =======================================================================

// تابع برای دریافت لیست مقالات
const fetchArticles = async (page: number): Promise<ApiResponse> => {
    const response = await fetch(`/api/admin/articles?page=${page}&limit=10`);
    if (!response.ok) {
        throw new Error('Failed to fetch articles');
    }
    return response.json();
};

// تابع برای تغییر وضعیت یک مقاله
const updateArticleStatus = async ({ articleId, status }: { articleId: number, status: 'APPROVED' | 'REJECTED' }) => {
    const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!response.ok) {
        throw new Error('Failed to update article status');
    }
    return response.json();
};

// تابع برای حذف یک مقاله
const deleteArticle = async (articleId: number) => {
    if (!window.confirm(`آیا از حذف مقاله با شناسه ${articleId} اطمینان دارید؟`)) {
        throw new Error('حذف توسط کاربر لغو شد.');
    }
    const response = await fetch('/api/admin/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId }),
    });
    if (!response.ok) {
        throw new Error('Failed to delete article');
    }
    return true;
};


// =======================================================================
//  3. کامپوننت اصلی (Main Component)
// =======================================================================
export const AdminArticlesTab = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const queryClient = useQueryClient();

    // استفاده از useQuery برای دریافت و کش کردن داده‌ها
    const { data, isLoading, isError } = useQuery<ApiResponse>({
        queryKey: ['admin-articles', currentPage],
        queryFn: () => fetchArticles(currentPage),
    });

    // استفاده از useMutation برای عملیات تغییر وضعیت
    const statusMutation = useMutation({
        mutationFn: updateArticleStatus,
        onSuccess: () => {
            // بعد از موفقیت، کوئری مربوط به لیست مقالات را باطل می‌کنیم تا داده‌ها دوباره گرفته شوند
            queryClient.invalidateQueries({ queryKey: ['admin-articles', currentPage] });
        },
        onError: () => {
            alert('خطا در تغییر وضعیت مقاله.');
        }
    });

    // استفاده از useMutation برای عملیات حذف
    const deleteMutation = useMutation({
        mutationFn: deleteArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-articles', currentPage] });
        },
        onError: (error) => {
            if (error.message !== 'حذف توسط کاربر لغو شد.') {
                alert('خطا در حذف مقاله.');
            }
        }
    });

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (data?.pagination.totalPages || 1)) {
            setCurrentPage(newPage);
        }
    };

    const getStatusBadge = (status: ArticleStatus) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="default" className="bg-green-500">تایید شده</Badge>;
            case 'PENDING': return <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">در انتظار</Badge>;
            case 'REJECTED': return <Badge variant="destructive">رد شده</Badge>;
            default: return <Badge variant="outline">نامشخص</Badge>;
        }
    }

    if (isLoading) {
        return <div className="space-y-2 mt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    }

    if (isError) {
        return <div className="text-center text-red-500 mt-4">خطا در دریافت اطلاعات مقالات.</div>
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
                        {data?.articles.map((article) => (
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
                                            <Button variant="ghost" size="icon" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ articleId: article.id, status: 'APPROVED' })}>
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ articleId: article.id, status: 'REJECTED' })}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="destructive" size="icon" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(article.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                            </PaginationItem>
                            {[...Array(data.pagination.totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        isActive={currentPage === i + 1}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </>
    );
};