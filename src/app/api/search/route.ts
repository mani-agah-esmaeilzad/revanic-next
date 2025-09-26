// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const ARTICLES_PER_PAGE = 5;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const page = Number(searchParams.get("page")) || 1;

    if (!query) {
        return NextResponse.json(
            { error: "Query parameter is required" },
            { status: 400 }
        );
    }

    try {
        const whereClause: Prisma.ArticleWhereInput = { // <-- Use Prisma type
            status: "APPROVED",
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } },
                {
                    tags: {
                        some: {
                            tag: {
                                name: {
                                    contains: query,
                                    mode: "insensitive",
                                },
                            },
                        },
                    },
                },
            ],
        };

        const articles = await prisma.article.findMany({
            where: whereClause,
            include: {
                author: { select: { name: true, avatarUrl: true } },
                _count: { select: { claps: true, comments: true } },
                categories: { select: { name: true } },
            },
            skip: (page - 1) * ARTICLES_PER_PAGE,
            take: ARTICLES_PER_PAGE,
            orderBy: { createdAt: 'desc' }
        });

        const totalArticles = await prisma.article.count({ where: whereClause });

        const users = await prisma.user.findMany({
            where: {
                name: { contains: query, mode: "insensitive" },
            },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                bio: true,
            },
            take: 5,
        });

        return NextResponse.json({
            articles,
            users,
            totalPages: Math.ceil(totalArticles / ARTICLES_PER_PAGE)
        });

    } catch (error) {
        console.error("SEARCH_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}