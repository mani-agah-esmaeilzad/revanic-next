// src/app/api/me/pin-article/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const token = cookies().get("token")?.value;
    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;

        const { articleId } = await req.json(); // articleId می‌تواند null هم باشد برای آن‌پین کردن

        // 1. دریافت اطلاعات فعلی کاربر
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 2. منطق پین / آن‌پین کردن
        let newPinnedArticleId: number | null;

        if (articleId === null) {
            // درخواست برای آن‌پین کردن (حذف پین فعلی)
            newPinnedArticleId = null;
        } else {
            // بررسی اینکه آیا مقاله متعلق به خود کاربر است
            const articleToPin = await prisma.article.findFirst({
                where: { id: articleId, authorId: userId },
            });

            if (!articleToPin) {
                return new NextResponse("Article not found or you are not the author.", { status: 403 });
            }

            // اگر مقاله فعلی از قبل پین شده بود، آن را آن‌پین کن. در غیر این صورت، پین کن.
            newPinnedArticleId = user.pinnedArticleId === articleId ? null : articleId;
        }

        // 3. به‌روزرسانی اطلاعات کاربر در دیتابیس
        await prisma.user.update({
            where: { id: userId },
            data: {
                pinnedArticleId: newPinnedArticleId,
            },
        });

        return NextResponse.json({ success: true, pinnedArticleId: newPinnedArticleId });

    } catch (error) {
        console.error("PIN_ARTICLE_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}