// src/app/api/me/bookmarks/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const token = cookies().get('token')?.value;
    if (!token) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId },
            include: {
                article: {
                    include: {
                        author: {
                            select: {
                                name: true,
                                avatarUrl: true, // <-- FIX: Add avatarUrl
                            },
                        },
                        _count: {
                            select: { claps: true, comments: true },
                        },
                        categories: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const articles = bookmarks.map((b) => b.article);
        return NextResponse.json(articles);
    } catch (error) {
        console.error('FETCH_BOOKMARKS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}