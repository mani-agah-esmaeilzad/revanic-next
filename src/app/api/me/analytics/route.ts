
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

        
        const totalViews = await prisma.articleView.count({ where: { articleId: { in: articleIds } } });
        const totalClapsResult = await prisma.clap.aggregate({ 
            _sum: { count: true },
            where: { articleId: { in: articleIds } }
        });
        const totalClaps = totalClapsResult._sum.count || 0; 
        const totalComments = await prisma.comment.count({ where: { articleId: { in: articleIds } } });

        
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

        const dailyViewsMap = new Map<string, number>();
        for (const view of dailyViewsRaw) {
            const day = format(new Date(view.viewedAt), 'yyyy-MM-dd');
            dailyViewsMap.set(day, (dailyViewsMap.get(day) || 0) + 1);
        }

        const chartData = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'yyyy-MM-dd');
            return {
                name: new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(date),
                views: dailyViewsMap.get(formattedDate) || 0
            };
        }).reverse();

        
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
            totalLikes: totalClaps, 
            totalComments,
            chartData,
            topArticles
        });

    } catch (error) {
        console.error('GET_ANALYTICS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}