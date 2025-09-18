// src/app/api/tags/[name]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
    try {
        const tagName = decodeURIComponent(params.name);
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        const tag = await prisma.tag.findUnique({
            where: { name: tagName },
            include: {
                articles: {
                    skip,
                    take: limit,
                    where: { article: { status: 'APPROVED' } },
                    include: {
                        article: {
                            include: {
                                author: { select: { name: true } },
                                _count: { select: { likes: true, comments: true } },
                                categories: { select: { name: true } },
                            },
                        },
                    },
                    orderBy: {
                        article: {
                            createdAt: 'desc',
                        },
                    },
                },
            },
        });

        if (!tag) {
            return new NextResponse('Tag not found', { status: 404 });
        }

        const articles = tag.articles.map(a => a.article);

        const totalArticles = await prisma.tagsOnArticles.count({
            where: { tagName: tagName, article: { status: 'APPROVED' } }
        });
        const totalPages = Math.ceil(totalArticles / limit);

        return NextResponse.json({
            tag,
            articles,
            pagination: {
                page,
                limit,
                totalArticles,
                totalPages
            }
        });

    } catch (error) {
        console.error(`GET_TAG_ARTICLES_ERROR`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}