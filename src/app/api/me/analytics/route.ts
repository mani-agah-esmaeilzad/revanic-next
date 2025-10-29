// src/app/api/me/analytics/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    // 1. دریافت تمام مقالات کاربر
    const articles = await prisma.article.findMany({
      where: { authorId: userId, status: "APPROVED" },
      include: {
        _count: {
          select: {
            views: true,
            claps: true,
            comments: true,
          },
        },
      },
    });

    // 2. محاسبه آمار کلی
    const totalArticles = articles.length;
    const totalViews = articles.reduce((sum, article) => sum + article._count.views, 0);
    const totalClaps = articles.reduce((sum, article) => sum + article._count.claps, 0);
    const totalComments = articles.reduce((sum, article) => sum + article._count.comments, 0);

    // 3. محاسبه داده‌های نمودار (بازدید در 30 روز گذشته)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyViews = await prisma.articleView.groupBy({
      by: ['viewedAt'],
      where: {
        article: {
          authorId: userId,
        },
        viewedAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        viewedAt: 'asc',
      },
    });
    
    // فرمت کردن داده‌ها برای نمودار
    const chartData = dailyViews.map(view => ({
        date: view.viewedAt.toISOString().split('T')[0], // فرمت YYYY-MM-DD
        views: view._count.id
    }));

    // 4. پیدا کردن ۵ مقاله برتر
    const topArticles = articles
      .sort((a, b) => b._count.views - a._count.views)
      .slice(0, 5)
      .map(article => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          views: article._count.views
      }));

    return NextResponse.json({
      stats: {
        totalArticles,
        totalViews,
        totalClaps,
        totalComments,
      },
      chartData,
      topArticles,
    });

  } catch (error) {
    console.error("ANALYTICS_API_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}