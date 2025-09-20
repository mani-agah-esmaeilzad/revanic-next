import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: { name: string } }
) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    try {
        const tagName = decodeURIComponent(params.name);

        
        
        
        const whereClause = {
            tags: {
                some: {
                    tag: {
                        name: tagName,
                    },
                },
            },
            status: 'APPROVED',
        };

        const articles = await prisma.article.findMany({
            where: whereClause,
            include: {
                author: { select: { name: true } },
                _count: { select: { claps: true, comments: true } },
                categories: { select: { name: true } },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limit,
        });

        const totalArticles = await prisma.article.count({ where: whereClause });
        const totalPages = Math.ceil(totalArticles / limit);

        return NextResponse.json({
            articles,
            pagination: {
                page,
                totalPages,
            }
        });

    } catch (error) {
        console.error("GET_ARTICLES_BY_TAG_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}