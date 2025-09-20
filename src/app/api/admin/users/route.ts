
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const userUpdateSchema = z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    bio: z.string().optional().nullable(),
    role: z.enum(['USER', 'ADMIN']).optional(),
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    try {
        const users = await prisma.user.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { articles: true, comments: true, followers: true },
                },
            },
        });

        const totalUsers = await prisma.user.count();
        const totalPages = Math.ceil(totalUsers / limit);

        const usersWithoutPasswords = users.map(({ password, ...user }) => user);

        return NextResponse.json({
            users: usersWithoutPasswords,
            pagination: { page, limit, totalUsers, totalPages }
        });
    } catch (error) {
        console.error('ADMIN_GET_USERS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}


export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) {
            return new NextResponse('User ID is required', { status: 400 });
        }
        const userId = Number(id);
        await prisma.$transaction(async (tx:any) => {
            await tx.like.deleteMany({ where: { userId } });
            await tx.bookmark.deleteMany({ where: { userId } });
            await tx.comment.deleteMany({ where: { userId } });
            await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });
            await tx.subscription.deleteMany({ where: { userId } });
            await tx.article.deleteMany({ where: { authorId: userId } });
            await tx.user.delete({ where: { id: userId } });
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('ADMIN_DELETE_USER_ERROR', error);
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
            return new NextResponse('User to delete does not exist.', { status: 404 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
export async function PUT(req: Request) {
    try {
        const { id, ...data } = await req.json();
        if (!id) {
            return new NextResponse('User ID is required', { status: 400 });
        }
        const validation = userUpdateSchema.safeParse(data);
        if (!validation.success) {
            return new NextResponse(validation.error.message, { status: 400 });
        }
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: validation.data,
        });
        const { password, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('ADMIN_UPDATE_USER_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}