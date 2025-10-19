// src/app/api/articles/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateArticleSlug } from '@/lib/article-slug';

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

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return new NextResponse('Article not found', { status: 404 });
    }

    if (article.authorId !== userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { title, content, published } = body;

    const data: Prisma.ArticleUpdateInput = {};
    if (typeof title === 'string' && title.trim()) {
      data.title = title;
      if (title !== article.title) {
        data.slug = await generateArticleSlug(title, article.id);
      }
    }

    if (typeof content === 'string') {
      data.content = content;
    }

    if (typeof published === 'boolean') {
      data.status = published ? 'APPROVED' : article.status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(article);
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data,
    });

    return NextResponse.json(updatedArticle);

  } catch (error) {
    console.error('ARTICLE_UPDATE_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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