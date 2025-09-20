
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

interface JwtPayload {
  userId: number;
}


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

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title,
        content,
        
      },
    });

    return NextResponse.json(updatedArticle);

  } catch (error) {
    console.error('ARTICLE_UPDATE_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


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

    
    if (article.authorId !== userId && user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    
    await prisma.$transaction(async (tx) => {
      
      await tx.clap.deleteMany({ where: { articleId } });
      await tx.comment.deleteMany({ where: { articleId } });
      await tx.bookmark.deleteMany({ where: { articleId } });
      await tx.tagsOnArticles.deleteMany({ where: { articleId } });

      
      await tx.article.update({
        where: { id: articleId },
        data: { categories: { set: [] } }
      });

      
      await tx.article.delete({ where: { id: articleId } });
    });
    

    return new NextResponse(null, { status: 204 }); 

  } catch (error) {
    console.error('ARTICLE_DELETE_ERROR', error);
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return new NextResponse('Article to delete does not exist.', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}