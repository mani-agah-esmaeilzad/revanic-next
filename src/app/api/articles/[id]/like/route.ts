import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

interface JwtPayload {
  userId: number;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    // Check if the like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingLike) {
      // User has already liked, so unlike it
      await prisma.like.delete({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });
      const newLikeCount = await prisma.like.count({ where: { articleId } });
      return NextResponse.json({ liked: false, likes: newLikeCount });
    } else {
      // User has not liked yet, so like it
      await prisma.like.create({
        data: {
          userId,
          articleId,
        },
      });
      const newLikeCount = await prisma.like.count({ where: { articleId } });
      return NextResponse.json({ liked: true, likes: newLikeCount });
    }

  } catch (error) {
    console.error('LIKE_ARTICLE_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
