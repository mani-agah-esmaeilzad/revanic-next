// src/app/api/admin/comments/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all comments for the admin panel with pagination
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    try {
        const comments = await prisma.comment.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true },
                },
                article: {
                    select: { id: true, slug: true, title: true },
                },
            },
        });

        const totalComments = await prisma.comment.count();
        const totalPages = Math.ceil(totalComments / limit);

        return NextResponse.json({
            comments,
            pagination: { page, limit, totalComments, totalPages }
        });

    } catch (error) {
        console.error('ADMIN_GET_COMMENTS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// DELETE a comment by admin
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) {
            return new NextResponse('Comment ID is required', { status: 400 });
        }
        await prisma.comment.delete({ where: { id: Number(id) } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('ADMIN_DELETE_COMMENT_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}