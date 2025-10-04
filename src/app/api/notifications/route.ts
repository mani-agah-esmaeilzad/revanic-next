// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { getNotificationsSnapshot } from '@/lib/notifications';

// GET: دریافت تمام نوتیفیکیشن‌های کاربر
export async function GET() {
    const token = cookies().get('token')?.value;
    if (!token) {
        return new NextResponse('Authentication token not found', { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;
        if (!userId) {
            return new NextResponse('Invalid token payload', { status: 401 });
        }

        const snapshot = await getNotificationsSnapshot(userId);

        return NextResponse.json(snapshot);
    } catch (error) {
        console.error('GET_NOTIFICATIONS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// PATCH: خوانده شده کردن تمام نوتیفیکیشن‌های خوانده نشده
export async function PATCH() {
    const token = cookies().get('token')?.value;
    if (!token) {
        return new NextResponse('Authentication token not found', { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;
        if (!userId) {
            return new NextResponse('Invalid token payload', { status: 401 });
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        return NextResponse.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('MARK_NOTIFICATIONS_READ_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}