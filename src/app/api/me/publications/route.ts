// src/app/api/me/publications/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

// GET: دریافت لیست انتشاراتی که کاربر عضو آنهاست
export async function GET() {
    const token = cookies().get('token')?.value;
    if (!token) {
        return new NextResponse('Authentication token not found', { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;

        const userPublications = await prisma.usersOnPublications.findMany({
            where: { userId },
            include: {
                publication: true, // شامل اطلاعات کامل انتشارات
            },
        });

        const publications = userPublications.map(up => up.publication);

        return NextResponse.json(publications);
    } catch (error) {
        console.error('GET_USER_PUBLICATIONS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}