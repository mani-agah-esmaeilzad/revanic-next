import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

interface JwtPayload {
  userId: number;
}

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
    const userId = (payload as JwtPayload).userId;
    const articleId = parseInt(params.id, 10);

    if (isNaN(articleId)) {
      return new NextResponse('Invalid article ID', { status: 400 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new NextResponse('Comment text is required', { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId,
        articleId,
      },
      include: {
        user: { // Include user details in the response
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

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
