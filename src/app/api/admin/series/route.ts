// src/app/api/admin/series/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const createSeriesSchema = z.object({
  title: z.string().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد'),
  slug: z
    .string()
    .min(2, 'اسلاگ باید حداقل ۲ کاراکتر باشد')
    .regex(/^[a-z0-9-]+$/i, 'اسلاگ فقط می‌تواند شامل حروف لاتین، اعداد و خط تیره باشد'),
  subtitle: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  coverImageUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export async function GET() {
  try {
    const series = await prisma.series.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { articles: true, followers: true } },
        curator: { select: { id: true, name: true } },
        articles: {
          orderBy: { order: 'asc' },
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
        },
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('ADMIN_GET_SERIES_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSeriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0]?.message ?? 'اطلاعات نامعتبر است.' }, { status: 400 });
    }

    const { title, slug, subtitle, description, coverImageUrl, status } = parsed.data;

    const existing = await prisma.series.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ message: 'سری دیگری با این اسلاگ وجود دارد.' }, { status: 409 });
    }

    const created = await prisma.series.create({
      data: {
        title,
        slug,
        subtitle: subtitle ?? null,
        description: description ?? null,
        coverImageUrl,
        status,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('ADMIN_CREATE_SERIES_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ message: 'شناسه سری ضروری است.' }, { status: 400 });
    }

    const seriesId = Number(id);
    if (!Number.isInteger(seriesId) || seriesId <= 0) {
      return NextResponse.json({ message: 'شناسه سری نامعتبر است.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.seriesArticle.deleteMany({ where: { seriesId } });
      await tx.seriesFollow.deleteMany({ where: { seriesId } });
      await tx.series.delete({ where: { id: seriesId } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('ADMIN_DELETE_SERIES_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}
