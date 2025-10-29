// src/app/api/articles/[id]/revisions/route.ts
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getUserIdFromSessionCookie } from '@/lib/auth-session';
import { requireArticleAccess } from '@/lib/articles/permissions';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const articleId = Number(params.id);
  if (!Number.isFinite(articleId)) {
    return NextResponse.json({ message: 'شناسه مقاله نامعتبر است.' }, { status: 400 });
  }

  const userId = await getUserIdFromSessionCookie();
  if (!userId) {
    return NextResponse.json({ message: 'ابتدا وارد شوید.' }, { status: 401 });
  }

  let access;
  try {
    access = await requireArticleAccess(articleId, userId);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : 'خطا در بررسی دسترسی';
    return NextResponse.json({ message }, { status });
  }

  if (!access || access.role === null) {
    return NextResponse.json({ message: 'دسترسی ندارید.' }, { status: 403 });
  }

  const revisions = await prisma.articleRevision.findMany({
    where: { articleId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json(
    revisions.map((revision) => ({
      id: revision.id,
      version: revision.version,
      title: revision.title,
      summary: revision.summary,
      createdAt: revision.createdAt,
      author: revision.author,
    }))
  );
}
