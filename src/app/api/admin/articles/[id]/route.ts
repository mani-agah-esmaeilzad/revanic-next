// src/app/api/admin/articles/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// Helper function to check for admin role
async function isAdmin(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.role === "ADMIN";
    } catch (error) {
        return false;
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const token = cookies().get("token")?.value;
    if (!(await isAdmin(token))) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    try {
        const articleId = parseInt(params.id, 10);
        const { status } = await req.json();

        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
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
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const token = cookies().get("token")?.value;
    if (!(await isAdmin(token))) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    try {
        const articleId = parseInt(params.id, 10);
        await prisma.article.delete({
            where: { id: articleId }
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("DELETE_ARTICLE_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}