// src/app/api/articles/[id]/revisions/[revisionId]/restore/route.ts
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getUserIdFromSessionCookie } from '@/lib/auth-session';
import { requireEditorAccess } from '@/lib/articles/permissions';
import { ArticleTimelineEventType } from '@prisma/client';

export async function POST(_request: Request, { params }: { params: { id: string; revisionId: string } }) {
  const articleId = Number(params.id);
  const revisionId = Number(params.revisionId);

  if (!Number.isFinite(articleId) || !Number.isFinite(revisionId)) {
    return NextResponse.json({ message: 'شناسه نامعتبر است.' }, { status: 400 });
  }

  const userId = await getUserIdFromSessionCookie();
  if (!userId) {
    return NextResponse.json({ message: 'ابتدا وارد شوید.' }, { status: 401 });
  }

  try {
    await requireEditorAccess(articleId, userId);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : 'خطا در بررسی دسترسی';
    return NextResponse.json({ message }, { status });
  }

  const revision = await prisma.articleRevision.findUnique({
    where: { id: revisionId },
  });

  if (!revision || revision.articleId !== articleId) {
    return NextResponse.json({ message: 'نسخه یافت نشد.' }, { status: 404 });
  }

  const nextVersion = (await prisma.articleRevision.count({ where: { articleId } })) + 1;

  const article = await prisma.$transaction(async (tx) => {
    // snapshot current state
    const current = await tx.article.findUnique({
      where: { id: articleId },
      select: { title: true, content: true },
    });

    if (!current) {
      throw Object.assign(new Error('Article not found'), { status: 404 });
    }

    await tx.articleRevision.create({
      data: {
        articleId,
        authorId: userId,
        version: nextVersion,
        title: current.title,
        content: current.content,
        summary: `بازگردانی به نسخه ${revision.version}`,
      },
    });

    const updated = await tx.article.update({
      where: { id: articleId },
      data: {
        title: revision.title,
        content: revision.content,
      },
    });

    await tx.articleTimelineEvent.create({
      data: {
        articleId,
        actorId: userId,
        type: ArticleTimelineEventType.REVISION_CREATED,
        payload: {
          version: nextVersion,
          restoredFrom: revision.version,
        },
      },
    });

    return updated;
  });

  return NextResponse.json(article);
}
