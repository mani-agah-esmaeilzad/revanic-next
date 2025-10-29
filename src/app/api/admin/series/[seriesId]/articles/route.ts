// src/app/api/admin/series/[seriesId]/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const assignArticleSchema = z.object({
  articleId: z.number({ required_error: 'شناسه مقاله الزامی است.' }),
  order: z
    .number({ required_error: 'ترتیب الزامی است.' })
    .int()
    .positive('ترتیب باید عددی مثبت باشد'),
  releaseAt: z.string().optional().nullable(),
});

const removeSchema = z.object({
  seriesArticleId: z.number({ required_error: 'شناسه آیتم سری الزامی است.' }),
});

export async function POST(req: NextRequest, { params }: { params: { seriesId: string } }) {
  const seriesId = Number(params.seriesId);

  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return NextResponse.json({ message: 'شناسه سری نامعتبر است.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = assignArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0]?.message ?? 'اطلاعات نامعتبر است.' }, { status: 400 });
    }

    const { articleId, order, releaseAt } = parsed.data;

    let releaseDate: Date | null = null;
    if (releaseAt) {
      const dateValue = new Date(releaseAt);
      if (Number.isNaN(dateValue.getTime())) {
        return NextResponse.json({ message: 'تاریخ انتشار نامعتبر است.' }, { status: 400 });
      }
      releaseDate = dateValue;
    }

    const [series, article] = await Promise.all([
      prisma.series.findUnique({ where: { id: seriesId } }),
      prisma.article.findUnique({ where: { id: articleId }, select: { status: true } }),
    ]);

    if (!series) {
      return NextResponse.json({ message: 'سری مورد نظر یافت نشد.' }, { status: 404 });
    }

    if (!article) {
      return NextResponse.json({ message: 'مقاله مورد نظر یافت نشد.' }, { status: 404 });
    }

    if (article.status !== 'APPROVED') {
      return NextResponse.json({ message: 'فقط مقالات تایید شده را می‌توان به سری اضافه کرد.' }, { status: 400 });
    }

    const existing = await prisma.seriesArticle.findFirst({
      where: {
        seriesId,
        OR: [{ articleId }, { order }],
      },
    });

    if (existing) {
      if (existing.articleId === articleId) {
        return NextResponse.json({ message: 'این مقاله قبلاً به سری اضافه شده است.' }, { status: 409 });
      }

      if (existing.order === order) {
        return NextResponse.json({ message: 'شماره ترتیب انتخاب شده قبلاً استفاده شده است.' }, { status: 409 });
      }
    }

    const created = await prisma.seriesArticle.create({
      data: {
        seriesId,
        articleId,
        order,
        releaseAt: releaseDate,
        releasedAt: releaseDate && releaseDate <= new Date() ? new Date() : null,
      },
      select: {
        id: true,
        order: true,
        releaseAt: true,
        releasedAt: true,
        notifiedAt: true,
        article: {
          select: {
            id: true,
            title: true,
            status: true,
            readTimeMinutes: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('ADMIN_ASSIGN_SERIES_ARTICLE_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { seriesId: string } }) {
  const seriesId = Number(params.seriesId);

  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return NextResponse.json({ message: 'شناسه سری نامعتبر است.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = removeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0]?.message ?? 'اطلاعات نامعتبر است.' }, { status: 400 });
    }

    const { seriesArticleId } = parsed.data;

    const record = await prisma.seriesArticle.findUnique({
      where: { id: seriesArticleId },
      select: { id: true, seriesId: true },
    });

    if (!record || record.seriesId !== seriesId) {
      return NextResponse.json({ message: 'آیتم مورد نظر در این سری یافت نشد.' }, { status: 404 });
    }

    await prisma.seriesArticle.delete({ where: { id: seriesArticleId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('ADMIN_REMOVE_SERIES_ARTICLE_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}
