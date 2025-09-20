// src/lib/admin/statsService.ts
import { prisma } from '@/lib/prisma';
import { subDays, format } from 'date-fns';

export async function getAdminDashboardStats() {
    // 1. آمار کلی
    const totalUsersPromise = prisma.user.count();
    const totalArticlesPromise = prisma.article.count({ where: { status: 'APPROVED' } });
    const pendingArticlesPromise = prisma.article.count({ where: { status: 'PENDING' } });
    const totalCommentsPromise = prisma.comment.count();

    const [totalUsers, totalArticles, pendingArticles, totalComments] = await Promise.all([
        totalUsersPromise,
        totalArticlesPromise,
        pendingArticlesPromise,
        totalCommentsPromise,
    ]);

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

    const latestUsersPromise = prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true }
    });

    const latestArticlesPromise = prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, author: { select: { name: true } } }
    });

    const [latestUsers, latestArticles] = await Promise.all([
        latestUsersPromise,
        latestArticlesPromise,
    ]);

    return {
        totalUsers,
        totalArticles,
        pendingArticles,
        totalComments,
        userChartData,
        latestUsers,
        latestArticles
    };
}