// src/components/AnalyticsDashboard.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';

interface AnalyticsData {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    chartData: { name: string; views: number }[];
    topArticles: { id: number; title: string; _count: { views: number } }[];
}

export const AnalyticsDashboard = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch('/api/me/analytics');
                if (response.ok) {
                    const analyticsData = await response.json();
                    setData(analyticsData);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <Skeleton className="h-80" />
                <Skeleton className="h-48" />
            </div>
        );
    }

    if (!data) {
        return <p className="text-center text-muted-foreground">اطلاعاتی برای نمایش وجود ندارد.</p>
    }

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مجموع بازدیدها</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalViews.toLocaleString('fa-IR')}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مجموع لایک‌ها</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalLikes.toLocaleString('fa-IR')}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مجموع نظرات</CardTitle>
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalComments.toLocaleString('fa-IR')}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Views Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>بازدید ۷ روز گذشته</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip wrapperClassName="!bg-background !border-border rounded-lg" />
                            <Bar dataKey="views" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

             {/* Top Articles */}
            <Card>
                <CardHeader>
                    <CardTitle>محبوب‌ترین مقالات شما</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.topArticles.map(article => (
                            <div key={article.id} className="flex items-center justify-between">
                                <Link href={`/articles/${article.id}`} className="font-medium hover:underline">{article.title}</Link>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Eye className="h-4 w-4 ml-2" />
                                    {article._count.views.toLocaleString('fa-IR')} بازدید
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};