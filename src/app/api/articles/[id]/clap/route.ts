
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const MAX_CLAPS = 50;

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

    const existingClap = await prisma.clap.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });

    let userClaps = 0;

    if (existingClap) {
      
      if (existingClap.count < MAX_CLAPS) {
        const updatedClap = await prisma.clap.update({
          where: { id: existingClap.id },
          data: { count: { increment: 1 } },
        });
        userClaps = updatedClap.count;
      } else {
        userClaps = existingClap.count; 
      }
    } else {
      
      const newClap = await prisma.clap.create({
        data: { userId, articleId, count: 1 },
      });
      userClaps = newClap.count;

      
      if (userId !== article.authorId) {
        const clapper = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        await prisma.notification.create({
          data: {
            type: 'CLAP', 
            message: `${clapper?.name || 'یک کاربر'} مقاله شما را تشویق کرد.`,
            userId: article.authorId,
            actorId: userId,
            articleId: articleId,
          }
        });
      }
    }

    
    const totalClapsResult = await prisma.clap.aggregate({
      _sum: {
        count: true,
      },
      where: { articleId },
    });
    const totalClaps = totalClapsResult._sum.count || 0;

    return NextResponse.json({
      userClaps: userClaps,
      totalClaps: totalClaps
    });

  } catch (error) {
    console.error('CLAP_ARTICLE_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}