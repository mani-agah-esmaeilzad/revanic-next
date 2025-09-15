import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

interface JwtPayload {
  userId: number;
}

export async function POST(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as JwtPayload).userId;

    const body = await req.json();
    const { tier } = body; // e.g., "GOLD", "PREMIUM"

    if (!tier) {
      return new NextResponse('Subscription tier is required', { status: 400 });
    }

    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() + 30); // Subscription valid for 30 days

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
