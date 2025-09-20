
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';


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
                    select: { claps: true, comments: true }, 
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


export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) {
            return new NextResponse('Article ID is required', { status: 400 });
        }
        const articleId = Number(id);

        await prisma.$transaction(async (tx:any) => {
            
            
            await tx.clap.deleteMany({ where: { articleId } }); 
            await tx.comment.deleteMany({ where: { articleId } });
            await tx.bookmark.deleteMany({ where: { articleId } });

            await tx.article.update({
                where: { id: articleId },
                data: {
                    categories: { set: [] },
                    tags: { deleteMany: {} }
                }
            });

            await tx.article.delete({ where: { id: articleId } });
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('ADMIN_DELETE_ARTICLE_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}