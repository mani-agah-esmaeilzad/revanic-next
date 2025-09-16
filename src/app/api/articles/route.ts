// src/app/api/articles/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from 'zod';
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  published: z.boolean(),
  categoryIds: z.array(z.number()).optional(),
  tags: z.array(z.string()).optional(),
  coverImageUrl: z.string().optional().nullable(),
});


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "6", 10);
  const skip = (page - 1) * limit;

  const where: any = { status: 'APPROVED' };

  if (search) {
    where.OR = [
      { title: { contains: search } }, // <-- FIX: 'mode' removed
      { content: { contains: search } }, // <-- FIX: 'mode' removed
    ];
  }

  if (category && category.toLowerCase() !== "همه") {
    where.categories = {
      some: { name: category },
    };
  }

  try {
    const articles = await prisma.article.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
        categories: { select: { name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalArticles = await prisma.article.count({ where });
    const totalPages = Math.ceil(totalArticles / limit);

    return NextResponse.json({
        articles,
        pagination: {
            page,
            limit,
            totalArticles,
            totalPages,
        }
    });

  } catch (error) {
    console.error("GET_ARTICLES_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return new NextResponse("Authentication token not found", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;
    if (!userId) {
        return new NextResponse('Invalid token payload', { status: 401 });
    }

    const body = await req.json();
    const validation = articleSchema.safeParse(body);

    if (!validation.success) {
      console.error("Zod validation failed:", validation.error.issues);
      return new NextResponse(validation.error.message, { status: 400 });
    }

    const { title, content, categoryIds, tags = [], coverImageUrl } = validation.data;

    const tagOperations = tags.map(tagName =>
      prisma.tag.upsert({
        where: { name: tagName.trim() },
        update: {},
        create: { name: tagName.trim() },
      })
    );
    const createdOrFoundTags = await prisma.$transaction(tagOperations);

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        coverImageUrl,
        status: 'PENDING',
        authorId: userId,
        categories: categoryIds ? { connect: categoryIds.map((id) => ({ id })) } : undefined,
        tags: {
          create: createdOrFoundTags.map(tag => ({
            tag: { connect: { id: tag.id } }
          }))
        }
      },
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("ARTICLE_CREATION_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}