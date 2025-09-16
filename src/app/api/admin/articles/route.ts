// src/app/api/admin/articles/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all articles for the admin panel with pagination
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    try {
        const articles = await prisma.article.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { name: true, email: true },
                },
                _count: {
                    select: { likes: true, comments: true },
                },
            },
        });

        const totalArticles = await prisma.article.count();
        const totalPages = Math.ceil(totalArticles / limit);

        return NextResponse.json({
            articles,
            pagination: { page, limit, totalArticles, totalPages }
        });

    } catch (error) {
        console.error('ADMIN_GET_ARTICLES_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// DELETE an article by admin
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) {
            return new NextResponse('Article ID is required', { status: 400 });
        }
        const articleId = Number(id);

        // In a transaction, delete all related data first
        await prisma.$transaction(async (tx) => {
            await tx.like.deleteMany({ where: { articleId } });
            await tx.comment.deleteMany({ where: { articleId } });
            await tx.bookmark.deleteMany({ where: { articleId } });

            // Disconnect categories before deleting the article
            await tx.article.update({
                where: { id: articleId },
                data: {
                    categories: {
                        set: []
                    }
                }
            });

            // Finally, delete the article itself
            await tx.article.delete({ where: { id: articleId } });
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('ADMIN_DELETE_ARTICLE_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}