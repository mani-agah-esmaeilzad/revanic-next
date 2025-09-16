// src/app/api/admin/articles/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const statusUpdateSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const articleId = Number(params.id);
        if (isNaN(articleId)) {
            return new NextResponse('Invalid Article ID', { status: 400 });
        }

        const body = await req.json();
        const validation = statusUpdateSchema.safeParse(body);

        if (!validation.success) {
            return new NextResponse(validation.error.message, { status: 400 });
        }

        const { status } = validation.data;

        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: { status },
        });

        // --- Create Notification ---
        await prisma.notification.create({
            data: {
                type: status === 'APPROVED' ? 'ARTICLE_APPROVED' : 'ARTICLE_REJECTED',
                message: `مقاله شما با عنوان "${updatedArticle.title}" ${status === 'APPROVED' ? 'تایید و منتشر شد' : 'رد شد'}.`,
                userId: updatedArticle.authorId, // Notify the article author
                articleId: articleId,
                // actorId is null because the admin is the actor
            }
        });

        return NextResponse.json(updatedArticle);
    } catch (error) {
        console.error('ADMIN_UPDATE_ARTICLE_STATUS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}