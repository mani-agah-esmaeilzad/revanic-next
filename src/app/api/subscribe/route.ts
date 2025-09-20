
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const subscribeSchema = z.object({
  tier: z.enum(['TRIAL', 'MONTHLY', 'YEARLY', 'STUDENT']),
  studentIdCardUrl: z.string().url().optional().nullable(), 
});

export async function POST(req: Request) {
  const token = cookies().get('token')?.value;
  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const body = await req.json();
    const validation = subscribeSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(validation.error.message, { status: 400 });
    }

    const { tier, studentIdCardUrl } = validation.data;

    const currentDate = new Date();
    let endDate: Date | null = new Date();
    let status = 'ACTIVE';

    switch (tier) {
      case 'TRIAL':
        endDate.setDate(currentDate.getDate() + 7);
        break;
      case 'MONTHLY':
        endDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'YEARLY':
        endDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      case 'STUDENT':
        status = 'PENDING_VERIFICATION';
        endDate = null; 
        if (!studentIdCardUrl) {
            return new NextResponse('Student ID card URL is required for student plan', { status: 400 });
        }
        break;
      default:
        endDate = null;
        break;
    }

    await prisma.subscription.upsert({
      where: { userId },
      update: { tier, status, endDate, studentIdCardUrl },
      create: { userId, tier, status, endDate, studentIdCardUrl },
    });

    return NextResponse.json({ message: `Subscription request for ${tier} received.` });

  } catch (error) {
    console.error('SUBSCRIPTION_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}