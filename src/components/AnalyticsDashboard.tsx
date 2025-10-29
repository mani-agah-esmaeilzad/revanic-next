// src/components/AnalyticsDashboard.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Eye, MessageSquare, Hand } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Link from "next/link";

// =======================================================================
//  1. تعریف تایپ‌ها برای داده‌های API
// =======================================================================
interface AnalyticsData {
  stats: {
    totalArticles: number;
    totalViews: number;
    totalClaps: number;
    totalComments: number;
  };
  chartData: {
    date: string;
    views: number;
  }[];
  topArticles: {
    id: number;
    slug: string;
    title: string;
    views: number;
  }[];
}

// =======================================================================
//  2. تابع Fetcher
// =======================================================================
const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  const response = await fetch("/api/me/analytics");
  if (!response.ok) {
    throw new Error("Failed to fetch analytics data.");
  }
  return response.json();
};

// =======================================================================
//  3. کامپوننت اصلی داشبورد
// =======================================================================
export function AnalyticsDashboard() {
  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["analytics-dashboard"],
    queryFn: fetchAnalyticsData,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>خطا</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            متاسفانه در بارگذاری آمار مشکلی پیش آمد. لطفا بعدا دوباره تلاش
            کنید.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { stats, chartData, topArticles } = data;

  return (
    <div className="space-y-6">
      {/* کارت‌های آمار کلی */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل بازدیدها</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل تشویق‌ها</CardTitle>
            <Hand className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClaps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل نظرات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مقالات</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </CardContent>
        </Card>
      </div>

      {/* نمودار بازدید */}
      <Card>
        <CardHeader>
          <CardTitle>نمودار بازدید ۳۰ روز گذشته</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* لیست مقالات برتر */}
      <Card>
          <CardHeader>
              <CardTitle>محبوب‌ترین مقالات (بر اساس بازدید)</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {topArticles.map((article, index) => (
                      <div key={article.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                            <Link href={`/articles/${article.slug}`} className="font-medium hover:underline">
                                {article.title}
                            </Link>
                          </div>
                          <div className="font-semibold">{article.views} بازدید</div>
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>

    </div>
  );
}