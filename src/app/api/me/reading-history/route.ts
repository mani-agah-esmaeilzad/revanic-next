// src/app/api/me/reading-history/route.ts
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

        const history = await prisma.readingHistory.findMany({
            where: { userId },
            orderBy: {
                viewedAt: 'desc', // مرتب‌سازی بر اساس آخرین بازدید
            },
            take: 20, // محدود کردن نتایج به ۲۰ مقاله آخر
            include: {
                article: { // دریافت اطلاعات کامل مقاله مرتبط
                    include: {
                        author: { select: { name: true, avatarUrl: true } },
                        categories: { select: { name: true } },
                        _count: { select: { claps: true, comments: true } },
                    },
                },
            },
        });

        // فقط آبجکت مقاله را از تاریخچه استخراج کن
        const articles = history.map(h => h.article);

        return NextResponse.json(articles);
    } catch (error) {
        console.error("FETCH_READING_HISTORY_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}