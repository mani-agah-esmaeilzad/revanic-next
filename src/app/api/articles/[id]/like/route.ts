// src/app/api/articles/[id]/like/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
      select: { authorId: true }
    });

    if (!article) {
      return new NextResponse('Article not found', { status: 404 });
    }

    const existingLike = await prisma.like.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { userId_articleId: { userId, articleId } },
      });
      // (Optional) You could also delete the notification here
      const newLikeCount = await prisma.like.count({ where: { articleId } });
      return NextResponse.json({ liked: false, likes: newLikeCount });
    } else {
      await prisma.like.create({
        data: { userId, articleId },
      });

      // --- Create Notification ---
      // Only notify if someone other than the author likes the post
      if (userId !== article.authorId) {
        const liker = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        await prisma.notification.create({
          data: {
            type: 'LIKE',
            message: `${liker?.name || 'یک کاربر'} مقاله شما را پسندید.`,
            userId: article.authorId, // Notify the article author
            actorId: userId, // The user who performed the action
            articleId: articleId,
          }
        });
      }

      const newLikeCount = await prisma.like.count({ where: { articleId } });
      return NextResponse.json({ liked: true, likes: newLikeCount });
    }

  } catch (error) {
    console.error('LIKE_ARTICLE_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}