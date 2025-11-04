"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Users,
  FileText,
  Clock,
  MessageSquare,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  pendingArticles: number;
  totalComments: number;
  userChartData: { name: string; users: number }[];
  latestUsers: { id: number; name: string | null; email: string }[];
  latestArticles: { id: number; title: string; status: string; author: { name: string | null } }[];
}

export const AdminDashboardClient = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setStats(data);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setIsLoading(false);
      }
    };

    const startStream = () => {
      source = new EventSource("/api/admin/stats/stream");

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!cancelled) {
            setStats(data);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Failed to parse admin stats stream payload", error);
        }
      };

      source.onerror = () => {
        console.warn("Admin stats stream disconnected, retrying...");
        source?.close();
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            startStream();
          }, 10000);
        }
        fetchStats();
      };
    };

    fetchStats();
    startStream();

    return () => {
      cancelled = true;
      source?.close();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);

  if (isLoading || !stats) {
    return <Skeleton className="h-[80vh] w-full" />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مقالات منتشر شده</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مقالات در انتظار تایید</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingArticles}</div>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>رشد کاربران</CardTitle>
            <CardDescription>کاربران جدید ثبت‌نام کرده در هر ماه</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.userChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#54A66F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">در انتظار بررسی</CardTitle>
              <CardDescription>اقدام سریع برای جلوگیری از تأخیر در انتشار</CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Activity className="h-3 w-3" />
              وضعیت فعلی
            </Badge>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between gap-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>این هفته {stats.pendingArticles} مقاله در صف بررسی باقی‌مانده است.</p>
              <p>پیشنهاد می‌شود برای جلوگیری از تأخیر بیش از ۴۸ ساعته، فرآیند بررسی تسریع شود.</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/manage">رفتن به مدیریت محتوا</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>کاربران جدید</CardTitle>
            <CardDescription>آخرین افرادی که در روانک ثبت‌نام کرده‌اند</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.latestUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage />
                    <AvatarFallback>{user.name?.charAt(0) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name ?? "کاربر جدید"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آخرین مقالات</CardTitle>
            <CardDescription>جدیدترین مقالات ارسال شده برای بررسی</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>نویسنده</TableHead>
                  <TableHead>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.latestArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>{article.author.name ?? "نامشخص"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardClient;
