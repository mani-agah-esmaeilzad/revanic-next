// src/app/api/me/likes/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return new NextResponse('Authentication token not found', { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // --- FIX ---
        const userId = payload.userId as number;
        if (!userId) {
            return new NextResponse('Invalid token payload', { status: 401 });
        }
        // --- END FIX ---

        const likes = await prisma.like.findMany({
            where: { userId },
            select: {
                article: {
                    include: {
                        author: { select: { name: true } },
                        _count: { select: { likes: true, comments: true } },
                        categories: { select: { name: true } },
                    },
                },
            },
        });

        const likedArticles = likes.map(l => l.article);

        return NextResponse.json(likedArticles);
    } catch (error) {
        console.error('GET_LIKES_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}