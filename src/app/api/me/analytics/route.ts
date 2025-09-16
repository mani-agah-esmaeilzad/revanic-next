// src/app/api/me/analytics/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { subDays, format } from 'date-fns';

interface JwtPayload {
  userId: number;
}

export async function GET() {
  const token = cookies().get('token')?.value;
  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;
    if (!userId) {
        return new NextResponse('Invalid token payload', { status: 401 });
    }

    const userArticles = await prisma.article.findMany({
        where: { authorId: userId },
        select: { id: true }
    });
    const articleIds = userArticles.map(a => a.id);

    // 1. آمار کلی
    const totalViews = await prisma.articleView.count({ where: { articleId: { in: articleIds } } });
    const totalLikes = await prisma.like.count({ where: { articleId: { in: articleIds } } });
    const totalComments = await prisma.comment.count({ where: { articleId: { in: articleIds } } });

    // 2. آمار بازدید ۷ روز گذشته برای نمودار
    const sevenDaysAgo = subDays(new Date(), 7);
    const dailyViewsRaw = await prisma.articleView.findMany({
        where: {
            articleId: { in: articleIds },
            viewedAt: { gte: sevenDaysAgo }
        },
        select: {
            viewedAt: true
        }
    });

    // Group views by day manually
    const dailyViewsMap = new Map<string, number>();
    for (const view of dailyViewsRaw) {
        const day = format(new Date(view.viewedAt), 'yyyy-MM-dd');
        dailyViewsMap.set(day, (dailyViewsMap.get(day) || 0) + 1);
    }

    // فرمت کردن داده‌ها برای نمودار
    const chartData = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), i);
        const formattedDate = format(date, 'yyyy-MM-dd');
        return {
            name: new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(date),
            views: dailyViewsMap.get(formattedDate) || 0
        };
    }).reverse();

    // 3. ۵ مقاله پربازدید
    const topArticles = await prisma.article.findMany({
        where: { authorId: userId },
        include: {
            _count: {
                select: { views: true }
            }
        },
        orderBy: {
            views: { _count: 'desc' }
        },
        take: 5
    });


    return NextResponse.json({
        totalViews,
        totalLikes,
        totalComments,
        chartData,
        topArticles
    });

  } catch (error) {
    console.error('GET_ANALYTICS_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}