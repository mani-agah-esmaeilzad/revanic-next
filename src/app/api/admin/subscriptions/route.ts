// src/app/api/admin/subscriptions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Resend } from 'resend';
import { SubscriptionStatusEmail } from '@/emails/SubscriptionStatusEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

const statusUpdateSchema = z.object({
    subscriptionId: z.number(),
    status: z.enum(['ACTIVE', 'REJECTED']),
});

// GET: دریافت تمام درخواست‌های اشتراک در انتظار تایید
export async function GET() {
    try {
        const pendingSubscriptions = await prisma.subscription.findMany({
            where: { status: 'PENDING_VERIFICATION' },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json(pendingSubscriptions);
    } catch (error) {
        console.error('ADMIN_GET_SUBSCRIPTIONS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// PATCH: تایید یا رد کردن یک درخواست اشتراک
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const validation = statusUpdateSchema.safeParse(body);

        if (!validation.success) {
            return new NextResponse(validation.error.message, { status: 400 });
        }

        const { subscriptionId, status } = validation.data;

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { user: true } // برای دسترسی به ایمیل و نام کاربر
        });

        if (!subscription) {
            return new NextResponse('Subscription not found', { status: 404 });
        }

        let endDate: Date | null = subscription.endDate;
        if (status === 'ACTIVE') {
            const now = new Date();
            endDate = new Date(now.setFullYear(now.getFullYear() + 1));
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status, endDate },
        });

        // ایجاد نوتیفیکیشن در سایت
        await prisma.notification.create({
            data: {
                userId: updatedSubscription.userId,
                type: 'SUBSCRIPTION_UPDATE',
                message: `درخواست اشتراک دانشجویی شما ${status === 'ACTIVE' ? 'تایید شد' : 'رد شد'}.`,
            }
        });

        // --- ارسال ایمیل وضعیت اشتراک ---
        try {
            await resend.emails.send({
                from: 'Revanic <alerts@resend.dev>',
                to: [subscription.user.email],
                subject: 'وضعیت اشتراک دانشجویی شما در روانیک',
                react: SubscriptionStatusEmail({
                    userName: subscription.user.name || '',
                    status: status
                })
            });
        } catch (emailError) {
            console.error("Failed to send subscription status email:", emailError);
        }

        return NextResponse.json(updatedSubscription);
    } catch (error) {
        console.error('ADMIN_UPDATE_SUBSCRIPTION_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}