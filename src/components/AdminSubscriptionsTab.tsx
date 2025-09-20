// src/components/AdminSubscriptionsTab.tsx
'use client';
import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';
import { Check, X, ExternalLink } from 'lucide-react';

interface SubscriptionRequest {
    id: number;
    status: string;
    studentIdCardUrl: string | null;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

export const AdminSubscriptionsTab = () => {
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/subscriptions');
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch subscription requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (subscriptionId: number, status: 'ACTIVE' | 'REJECTED') => {
        try {
            const response = await fetch('/api/admin/subscriptions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId, status }),
            });
            if (response.ok) {
                fetchRequests(); // Refresh the list
            } else {
                alert('خطا در به‌روزرسانی وضعیت.');
            }
        } catch (error) {
            console.error('Failed to update subscription status:', error);
        }
    };

    if (isLoading) {
        return <div className="space-y-2 mt-4"><Skeleton className="h-24 w-full" /></div>
    }

    return (
        <div className="rounded-lg border mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>کاربر</TableHead>
                        <TableHead>تاریخ درخواست</TableHead>
                        <TableHead>کارت دانشجویی</TableHead>
                        <TableHead>عملیات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length > 0 ? requests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell>
                                <div className="font-medium">{req.user.name || 'بی‌نام'}</div>
                                <div className="text-sm text-muted-foreground">{req.user.email}</div>
                            </TableCell>
                            <TableCell>{new Intl.DateTimeFormat('fa-IR').format(new Date(req.createdAt))}</TableCell>
                            <TableCell>
                                {req.studentIdCardUrl ? (
                                    <a href={req.studentIdCardUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
                                        مشاهده تصویر <ExternalLink className="h-4 w-4 mr-2" />
                                    </a>
                                ) : (
                                    'ارسال نشده'
                                )}
                            </TableCell>
                            <TableCell className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleStatusUpdate(req.id, 'ACTIVE')}>
                                    <Check className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleStatusUpdate(req.id, 'REJECTED')}>
                                    <X className="h-4 w-4 text-red-500" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">درخواست جدیدی برای بررسی وجود ندارد.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};