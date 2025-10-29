// src/app/api/series/[slug]/notifications/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { getUserIdFromSessionCookie } from '@/lib/auth-session';
import { followSeries, updateSeriesNotificationPreferences } from '@/lib/series';

export const dynamic = 'force-dynamic';

const preferencesSchema = z.object({
  notifyByEmail: z.boolean(),
});

interface RouteContext {
  params: { slug: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const userId = await getUserIdFromSessionCookie();
    if (!userId) {
      return NextResponse.json({ message: 'برای مدیریت اعلان‌ها باید وارد شوید.' }, { status: 401 });
    }

    const { slug } = params;
    const series = await prisma.series.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!series) {
      return NextResponse.json({ message: 'سری مورد نظر یافت نشد.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = preferencesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'اطلاعات ارسال شده نامعتبر است.' }, { status: 400 });
    }

    const { notifyByEmail } = validation.data;

    const existing = await prisma.seriesFollow.findUnique({
      where: {
        userId_seriesId: {
          userId,
          seriesId: series.id,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      if (!notifyByEmail) {
        return NextResponse.json({ message: 'برای مدیریت اعلان‌ها ابتدا سری را دنبال کنید.' }, { status: 400 });
      }
      await followSeries(series.id, userId, { notifyByEmail: true });
    } else {
      await updateSeriesNotificationPreferences(series.id, userId, { notifyByEmail });
    }

    return NextResponse.json({ notifyByEmail });
  } catch (error) {
    console.error('SERIES_NOTIFICATION_PREFERENCES_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}
