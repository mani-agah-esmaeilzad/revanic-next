// src/app/api/articles/[id]/collaborators/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ArticleCollaboratorRole, ArticleTimelineEventType } from '@prisma/client';

import { getUserIdFromSessionCookie } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { requireArticleAccess, requireOwnerAccess } from '@/lib/articles/permissions';

const mutateSchema = z.object({
  userId: z.number(),
  role: z.nativeEnum(ArticleCollaboratorRole).default(ArticleCollaboratorRole.EDITOR),
});

const deleteSchema = z.object({
  userId: z.number(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const articleId = Number(params.id);
  if (!Number.isFinite(articleId)) {
    return NextResponse.json({ message: 'شناسه مقاله نامعتبر است.' }, { status: 400 });
  }

  const userId = await getUserIdFromSessionCookie();
  if (!userId) {
    return NextResponse.json({ message: 'برای مشاهده باید وارد شوید.' }, { status: 401 });
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

  const collaborators = await prisma.articleCollaborator.findMany({
    where: { articleId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(collaborators.map((item) => ({
    id: item.id,
    role: item.role,
    createdAt: item.createdAt,
    user: item.user,
  })));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const articleId = Number(params.id);
  if (!Number.isFinite(articleId)) {
    return NextResponse.json({ message: 'شناسه مقاله نامعتبر است.' }, { status: 400 });
  }

  const userId = await getUserIdFromSessionCookie();
  if (!userId) {
    return NextResponse.json({ message: 'ابتدا وارد شوید.' }, { status: 401 });
  }

  try {
    await requireOwnerAccess(articleId, userId);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : 'خطا در بررسی دسترسی';
    return NextResponse.json({ message }, { status });
  }

  const body = await request.json();
  const validation = mutateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'داده ارسالی نامعتبر است.' }, { status: 400 });
  }

  const targetUserId = validation.data.userId;
  if (targetUserId === userId) {
    return NextResponse.json({ message: 'نمی‌توانید خود را به عنوان همکار اضافه کنید.' }, { status: 400 });
  }

  const existing = await prisma.articleCollaborator.findUnique({
    where: {
      articleId_userId: {
        articleId,
        userId: targetUserId,
      },
    },
    select: { id: true },
  });

  const collaborator = await prisma.articleCollaborator.upsert({
    where: {
      articleId_userId: {
        articleId,
        userId: targetUserId,
      },
    },
    create: {
      articleId,
      userId: targetUserId,
      role: validation.data.role,
    },
    update: {
      role: validation.data.role,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  await prisma.articleTimelineEvent.create({
    data: {
      articleId,
      actorId: userId,
      type: existing
        ? ArticleTimelineEventType.COLLABORATOR_UPDATED
        : ArticleTimelineEventType.COLLABORATOR_ADDED,
      payload: {
        collaboratorId: collaborator.userId,
        role: collaborator.role,
      },
    },
  });

  return NextResponse.json({
    id: collaborator.id,
    role: collaborator.role,
    createdAt: collaborator.createdAt,
    user: collaborator.user,
  });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const articleId = Number(params.id);
  if (!Number.isFinite(articleId)) {
    return NextResponse.json({ message: 'شناسه مقاله نامعتبر است.' }, { status: 400 });
  }

  const userId = await getUserIdFromSessionCookie();
  if (!userId) {
    return NextResponse.json({ message: 'ابتدا وارد شوید.' }, { status: 401 });
  }

  try {
    await requireOwnerAccess(articleId, userId);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : 'خطا در بررسی دسترسی';
    return NextResponse.json({ message }, { status });
  }

  const body = await request.json();
  const validation = deleteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'داده ارسالی نامعتبر است.' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const removed = await tx.articleCollaborator.deleteMany({
      where: {
        articleId,
        userId: validation.data.userId,
      },
    });

    if (removed.count > 0) {
      await tx.articleTimelineEvent.create({
        data: {
          articleId,
          actorId: userId,
          type: ArticleTimelineEventType.COLLABORATOR_REMOVED,
          payload: {
            collaboratorId: validation.data.userId,
          },
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
