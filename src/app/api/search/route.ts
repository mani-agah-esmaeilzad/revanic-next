// src/app/api/search/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const authorId = searchParams.get('authorId');
    const categoryId = searchParams.get('categoryId');

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: any = { status: 'APPROVED' };

    if (query) {
        where.OR = [
            { title: { contains: query } }, // <-- FIX: 'mode' removed
            { content: { contains: query } }, // <-- FIX: 'mode' removed
        ];
    }

    if (authorId) {
        where.authorId = parseInt(authorId, 10);
    }

    if (categoryId) {
        where.categories = {
            some: { id: parseInt(categoryId, 10) },
        };
    }

    try {
        const articles = await prisma.article.findMany({
            where,
            skip,
            take: limit,
            include: {
                author: { select: { name: true } },
                _count: { select: { likes: true, comments: true } },
                categories: { select: { name: true } },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const totalArticles = await prisma.article.count({ where });
        const totalPages = Math.ceil(totalArticles / limit);

        return NextResponse.json({
            articles,
            pagination: {
                page,
                limit,
                totalArticles,
                totalPages,
            }
        });

    } catch (error) {
        console.error("SEARCH_API_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}