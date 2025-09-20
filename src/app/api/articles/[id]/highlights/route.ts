
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


const highlightSchema = z.object({
  text: z.string().min(1),
  domId: z.string().uuid(),
});


export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const articleId = parseInt(params.id, 10);
    if (isNaN(articleId)) {
      return new NextResponse('Invalid article ID', { status: 400 });
    }

    const highlights = await prisma.highlight.findMany({
      where: { articleId },
      include: {
        user: { select: { id: true, name: true } }, 
      },
    });

    return NextResponse.json(highlights);
  } catch (error) {
    console.error('GET_HIGHLIGHTS_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) {
    return new NextResponse('Authentication required', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;
    const articleId = parseInt(params.id, 10);

    const body = await req.json();
    const validation = highlightSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { text, domId } = validation.data;

    const newHighlight = await prisma.highlight.create({
      data: {
        text,
        domId,
        articleId,
        userId,
      },
    });

    return NextResponse.json(newHighlight, { status: 201 });
  } catch (error) {
    console.error('CREATE_HIGHLIGHT_ERROR', error);
    
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        return new NextResponse('Highlight with this ID already exists', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}