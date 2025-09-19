// src/app/api/admin/articles/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Resend } from 'resend';
import { ArticleStatusEmail } from '@/emails/ArticleStatusEmail';

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

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
            include: { author: true }, // for author email and name
        });

        // Create in-site notification
        await prisma.notification.create({
            data: {
                type: status === 'APPROVED' ? 'ARTICLE_APPROVED' : 'ARTICLE_REJECTED',
                message: `مقاله شما با عنوان "${updatedArticle.title}" ${status === 'APPROVED' ? 'تایید و منتشر شد' : 'رد شد'}.`,
                userId: updatedArticle.authorId,
                articleId: articleId,
            }
        });

        // --- Send article status email ---
        try {
            await resend.emails.send({
                from: 'Revanic <alerts@resend.dev>',
                to: [updatedArticle.author.email],
                subject: `وضعیت مقاله شما: ${updatedArticle.title}`,
                react: ArticleStatusEmail({
                    authorName: updatedArticle.author.name || '',
                    articleTitle: updatedArticle.title,
                    status: status,
                    articleId: updatedArticle.id
                }),
            });
        } catch (emailError) {
            console.error("Failed to send article status email:", emailError);
        }

        return NextResponse.json(updatedArticle);
    } catch (error) {
        console.error('ADMIN_UPDATE_ARTICLE_STATUS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}