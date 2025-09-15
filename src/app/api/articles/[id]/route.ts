import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

interface JwtPayload {
  userId: number;
}

// UPDATE an article
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as JwtPayload).userId;
    const articleId = parseInt(params.id, 10);

    if (isNaN(articleId)) {
      return new NextResponse('Invalid article ID', { status: 400 });
    }

    // Verify ownership
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

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title,
        content,
        published,
      },
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
      const userId = (payload as JwtPayload).userId;
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

      await prisma.article.delete({ where: { id: articleId } });

      return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
      console.error('ARTICLE_DELETE_ERROR', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
