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

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingBookmark) {
      // Already bookmarked, so remove it
      await prisma.bookmark.delete({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });
      return NextResponse.json({ bookmarked: false });
    } else {
      // Not bookmarked, so add it
      await prisma.bookmark.create({
        data: {
          userId,
          articleId,
        },
      });
      return NextResponse.json({ bookmarked: true });
    }

  } catch (error) {
    console.error('BOOKMARK_ARTICLE_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
