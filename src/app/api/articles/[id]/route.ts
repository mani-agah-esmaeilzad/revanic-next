// src/app/api/articles/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { requireEditorAccess } from '@/lib/articles/permissions';
import { ArticleTimelineEventType } from '@prisma/client';

interface JwtPayload {
  userId: number;
}

// UPDATE an article (This function remains unchanged)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;
    const articleId = parseInt(params.id, 10);

    if (isNaN(articleId)) {
      return new NextResponse('Invalid article ID', { status: 400 });
    }

    const access = await requireEditorAccess(articleId, userId);
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return new NextResponse('Article not found', { status: 404 });
    }

    const body = await req.json();
    const { title, content, summary } = body;

    const nextTitle = typeof title === 'string' && title.trim().length > 0 ? title.trim() : article.title;
    const nextContent = typeof content === 'string' ? content : article.content;
    const revisionSummary = typeof summary === 'string' && summary.trim().length > 0 ? summary.trim() : null;

    const nextVersion = (await prisma.articleRevision.count({ where: { articleId } })) + 1;

    const updatedArticle = await prisma.$transaction(async (tx) => {
      await tx.articleRevision.create({
        data: {
          articleId,
          authorId: userId,
          version: nextVersion,
          title: article.title,
          content: article.content,
          summary: revisionSummary,
        },
      });

      const updated = await tx.article.update({
        where: { id: articleId },
        data: {
          title: nextTitle,
          content: nextContent,
        },
      });

      await tx.articleTimelineEvent.create({
        data: {
          articleId,
          actorId: userId,
          type: ArticleTimelineEventType.REVISION_CREATED,
          payload: {
            version: nextVersion,
            summary: revisionSummary,
            role: access.role,
          },
        },
      });

      return updated;
    });

    return NextResponse.json(updatedArticle);

  } catch (error) {
    console.error('ARTICLE_UPDATE_ERROR', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: number }).status ?? 500;
      return new NextResponse(message, { status });
    }
    return new NextResponse(message, { status: 500 });
  }
}

// DELETE an article
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;
    const articleId = parseInt(params.id, 10);

    if (isNaN(articleId)) {
      return new NextResponse('Invalid article ID', { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return new NextResponse('Article not found', { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // فقط نویسنده مقاله یا ادمین می‌تواند آن را حذف کند
    if (article.authorId !== userId && user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // --- FIX START: Use a transaction to delete dependencies first ---
    await prisma.$transaction(async (tx) => {
      // حذف تمام رکوردهای وابسته
      await tx.clap.deleteMany({ where: { articleId } });
      await tx.comment.deleteMany({ where: { articleId } });
      await tx.bookmark.deleteMany({ where: { articleId } });
      await tx.tagsOnArticles.deleteMany({ where: { articleId } });

      // قطع اتصال دسته‌بندی‌ها
      await tx.article.update({
        where: { id: articleId },
        data: { categories: { set: [] } }
      });

      // در نهایت، حذف خود مقاله
      await tx.article.delete({ where: { id: articleId } });
    });
    // --- FIX END ---

    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    console.error('ARTICLE_DELETE_ERROR', error);
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return new NextResponse('Article to delete does not exist.', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
