// src/components/Notifications.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';

interface Notification {
    id: number;
    type: string;
    message: string;
    isRead: boolean;
    articleId: number | null;
    actor: {
        id: number;
        name: string | null;
    } | null;
    createdAt: string;
}

export const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async () => {
        if (unreadCount === 0) return;

        try {
            await fetch('/api/notifications', { method: 'PATCH' });
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
    };

    return (
        <Popover onOpenChange={(open) => { if (open) handleMarkAsRead(); }}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">اعلانات</h4>
                        <p className="text-sm text-muted-foreground">آخرین رویدادهای شما</p>
                    </div>
                    <div className="grid gap-2 max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map(notif => (
                                <Link
                                    key={notif.id}
                                    href={notif.articleId ? `/articles/${notif.articleId}` : (notif.actor ? `/authors/${notif.actor.id}` : '#')}
                                    className={`flex items-start gap-3 rounded-lg p-2 transition-all hover:bg-accent ${!notif.isRead ? 'bg-accent/50' : ''}`}
                                >
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(notif.createdAt))}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">شما اعلان جدیدی ندارید.</p>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};