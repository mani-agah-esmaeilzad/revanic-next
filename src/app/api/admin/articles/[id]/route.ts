// src/app/api/admin/articles/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

async function updateArticleStatus(
  req: Request,
  { params }: { params: { id: string } },
) {
    const adminSession = await requireAdminSession();
    if (!adminSession) {
        return NextResponse.json({ message: "دسترسی غیرمجاز." }, { status: 403 });
    }

    try {
        const articleId = parseInt(params.id, 10);
        const { status } = await req.json();

        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return NextResponse.json({ message: "وضعیت انتخاب‌شده معتبر نیست." }, { status: 400 });
        }

        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: { status },
        });

        // =======================================================================
        // --- تغییر اصلی در این بخش اعمال شده است ---
        // =======================================================================
        if (status === "APPROVED" || status === "REJECTED") {
            const statusText = status === "APPROVED" ? "تایید شد" : "رد شد";
            const notificationType = status === "APPROVED" ? 'ARTICLE_APPROVED' : 'ARTICLE_REJECTED';

            await prisma.notification.create({
                data: {
                    type: notificationType,
                    message: `مقاله شما با عنوان "${updatedArticle.title}" ${statusText}.`,
                    userId: updatedArticle.authorId, // Notify the author of the article
                    articleId: updatedArticle.id,
                    // actorId can be null or the admin's ID if you want to track it
                }
            });
        }
        // =======================================================================

        return NextResponse.json(updatedArticle);
    } catch (error) {
        console.error("UPDATE_ARTICLE_STATUS_ERROR", error);
        return NextResponse.json({ message: "خطای داخلی سرور" }, { status: 500 });
    }
}

export async function PUT(
  req: Request,
  context: { params: { id: string } },
) {
  return updateArticleStatus(req, context);
}

export async function PATCH(
  req: Request,
  context: { params: { id: string } },
) {
  return updateArticleStatus(req, context);
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const adminSession = await requireAdminSession();
    if (!adminSession) {
        return NextResponse.json({ message: "دسترسی غیرمجاز." }, { status: 403 });
    }

    try {
        const articleId = parseInt(params.id, 10);
        await prisma.article.delete({
            where: { id: articleId }
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("DELETE_ARTICLE_ERROR", error);
        return NextResponse.json({ message: "خطای داخلی سرور" }, { status: 500 });
    }
}
