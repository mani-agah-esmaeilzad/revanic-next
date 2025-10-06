// src/app/api/analytics/events/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logServerEvent } from '@/lib/analytics';
import { getUserIdFromSessionCookie } from '@/lib/auth-session';

const eventSchema = z.object({
  name: z.string().min(1),
  journeyId: z.string().min(1).optional(),
  experimentId: z.string().min(1).optional(),
  variant: z.string().min(1).optional(),
  payload: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validation = eventSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json({ message: 'Event payload invalid' }, { status: 400 });
    }

    const userId = await getUserIdFromSessionCookie();

    await logServerEvent({
      name: validation.data.name,
      journeyId: validation.data.journeyId,
      userId,
      experimentId: validation.data.experimentId,
      variant: validation.data.variant,
      payload: validation.data.payload,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('TRACKING_EVENT_API_ERROR', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
