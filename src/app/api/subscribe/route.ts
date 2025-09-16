// src/app/api/subscribe/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const subscribeSchema = z.object({
  tier: z.enum(['TRIAL', 'MONTHLY', 'YEARLY', 'STUDENT']),
});

export async function POST(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

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

    const { tier } = validation.data;

    const currentDate = new Date();
    let endDate: Date | null = new Date();

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
        // For student, you might want a manual verification process.
        // For now, we'll give them a year.
        endDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        endDate = null;
        break;
    }

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        status: 'ACTIVE',
        endDate,
      },
      create: {
        userId,
        tier,
        status: 'ACTIVE',
        endDate,
      },
    });

    return NextResponse.json({ message: `Successfully subscribed to ${tier} tier.` });

  } catch (error) {
    console.error('SUBSCRIPTION_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}