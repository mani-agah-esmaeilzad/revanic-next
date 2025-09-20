// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, format } from 'date-fns';

export async function GET() {
    try {
        // 1. آمار کلی
        const totalUsers = await prisma.user.count();
        const totalArticles = await prisma.article.count({ where: { status: 'APPROVED' } });
        const pendingArticles = await prisma.article.count({ where: { status: 'PENDING' } });
        const totalComments = await prisma.comment.count();

        // 2. کاربران جدید در ۷ روز گذشته برای نمودار
        const sevenDaysAgo = subDays(new Date(), 7);
        const newUsersRaw = await prisma.user.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true }
        });

        const dailyUserMap = new Map<string, number>();
        for (const user of newUsersRaw) {
            const day = format(new Date(user.createdAt), 'yyyy-MM-dd');
            dailyUserMap.set(day, (dailyUserMap.get(day) || 0) + 1);
        }

        const userChartData = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'yyyy-MM-dd');
            return {
                name: new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(date),
                users: dailyUserMap.get(formattedDate) || 0
            };
        }).reverse();

        // 3. آخرین فعالیت‌ها
        const latestUsers = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, name: true, email: true }
        });

        const latestArticles = await prisma.article.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, title: true, status: true, author: { select: { name: true } } }
        });


        return NextResponse.json({
            totalUsers,
            totalArticles,
            pendingArticles,
            totalComments,
            userChartData,
            latestUsers,
            latestArticles
        });

    } catch (error) {
        console.error('ADMIN_GET_STATS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}