// src/app/api/articles/[id]/progress/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const progressSchema = z.object({
  progress: z.number().min(0).max(100),
  completed: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'ابتدا وارد حساب کاربری خود شوید.' }, { status: 401 });
  }

  try {
    const articleId = Number(params.id);
    if (!Number.isInteger(articleId)) {
      return NextResponse.json({ message: 'شناسه مقاله نامعتبر است.' }, { status: 400 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const json = await request.json();
    const validation = progressSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json({ message: 'مقدار پیشرفت نامعتبر است.' }, { status: 400 });
    }

    const { progress, completed } = validation.data;
    const normalized = Math.max(0, Math.min(1, completed ? 1 : progress / 100));

    const existing = await prisma.readingHistory.findUnique({
      where: { userId_articleId: { userId, articleId } },
      select: { id: true, progress: true },
    });

    let nextProgress = normalized;

    if (existing) {
      nextProgress = normalized === 1 ? 1 : Math.max(existing.progress ?? 0, normalized);
      await prisma.readingHistory.update({
        where: { id: existing.id },
        data: { progress: nextProgress },
      });
    } else {
      const record = await prisma.readingHistory.create({
        data: {
          userId,
          articleId,
          progress: nextProgress,
        },
        select: { progress: true },
      });
      nextProgress = record.progress ?? nextProgress;
    }

    return NextResponse.json({ progressPercent: Math.round(nextProgress * 100) });
  } catch (error) {
    console.error('ARTICLE_PROGRESS_UPDATE_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}
