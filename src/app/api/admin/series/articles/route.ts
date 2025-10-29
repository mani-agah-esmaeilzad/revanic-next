// src/app/api/admin/series/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const takeParam = searchParams.get('take');
    const take = Math.min(Math.max(Number(takeParam) || 15, 1), 50);

    const articles = await prisma.article.findMany({
      where: {
        status: 'APPROVED',
        ...(search
          ? {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        createdAt: true,
        status: true,
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('ADMIN_SERIES_AVAILABLE_ARTICLES_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}
