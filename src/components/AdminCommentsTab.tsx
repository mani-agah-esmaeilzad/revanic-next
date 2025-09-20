// src/components/AdminCommentsTab.tsx
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
import { Trash2 } from 'lucide-react';
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

interface Comment {
    id: number;
    text: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
    article: {
        id: number;
        title: string;
    };
}

interface PaginationInfo {
    page: number;
    totalPages: number;
}

export const AdminCommentsTab = () => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    const fetchComments = useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/comments?page=${page}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComments(1);
    }, [fetchComments]);

    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm(`آیا از حذف نظر با شناسه ${commentId} اطمینان دارید؟`)) {
            return;
        }
        try {
            const response = await fetch('/api/admin/comments', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: commentId }),
            });
            if (response.ok) {
                fetchComments(pagination?.page || 1);
            } else {
                alert('خطا در حذف نظر.');
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
            fetchComments(newPage);
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
                            <TableHead>متن نظر</TableHead>
                            <TableHead>کاربر</TableHead>
                            <TableHead>مقاله</TableHead>
                            <TableHead>تاریخ</TableHead>
                            <TableHead>عملیات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {comments.map((comment) => (
                            <TableRow key={comment.id}>
                                <TableCell className="max-w-xs truncate">{comment.text}</TableCell>
                                <TableCell>{comment.user.name} ({comment.user.email})</TableCell>
                                <TableCell>
                                    <Link href={`/articles/${comment.article.id}`} className="hover:underline" target="_blank">
                                        {comment.article.title}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {new Intl.DateTimeFormat('fa-IR').format(new Date(comment.createdAt))}
                                </TableCell>
                                <TableCell>
                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteComment(comment.id)}>
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