// src/app/api/articles/[id]/comments/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { z } from 'zod'; // <-- ایمپورت Zod

// تعریف اسکیمای اعتبارسنجی
const commentSchema = z.object({
  text: z.string().min(1, { message: "متن نظر نمی‌تواند خالی باشد." }).max(1000, { message: "متن نظر نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد." }),
});

// POST a new comment
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

    const body = await req.json();

    // اعتبارسنجی داده‌های ورودی با Zod
    const validation = commentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const { text } = validation.data;

    const newComment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId,
        articleId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // --- Create Notification ---
    if (userId !== article.authorId) {
      const commenter = newComment.user;
      await prisma.notification.create({
        data: {
          type: 'COMMENT',
          message: `${commenter.name || 'یک کاربر'} برای مقاله شما نظری ثبت کرد.`,
          userId: article.authorId, // Notify the article author
          actorId: userId,
          articleId: articleId,
        }
      });
    }

    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error('COMMENT_POST_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// GET all comments for an article
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const articleId = parseInt(params.id, 10);

    if (isNaN(articleId)) {
      return new NextResponse('Invalid article ID', { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { articleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(comments);

  } catch (error) {
    console.error('COMMENT_GET_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}