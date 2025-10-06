// src/app/api/push/subscribe/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { getUserIdFromSessionCookie } from '@/lib/auth-session';
import { getJourneyIdFromHeaders } from '@/lib/analytics';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validation = subscriptionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'اطلاعات اشتراک نامعتبر است.' }, { status: 400 });
  }

  const userId = await getUserIdFromSessionCookie();
  const journeyId = getJourneyIdFromHeaders(request.headers);

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint: validation.data.endpoint },
    create: {
      endpoint: validation.data.endpoint,
      p256dh: validation.data.keys.p256dh,
      auth: validation.data.keys.auth,
      userId: userId ?? null,
      journeyId: journeyId ?? null,
    },
    update: {
      p256dh: validation.data.keys.p256dh,
      auth: validation.data.keys.auth,
      userId: userId ?? null,
      journeyId: journeyId ?? null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, id: subscription.id });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;

  if (typeof endpoint !== 'string') {
    return NextResponse.json({ message: 'شناسه اشتراک نامعتبر است.' }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
