// src/app/api/articles/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from 'zod';
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// اسکیمای اعتبارسنجی برای داده‌های ورودی هنگام ایجاد مقاله
const articleSchema = z.object({
  title: z.string().min(1, 'عنوان مقاله الزامی است'),
  content: z.string().min(1, 'محتوای مقاله الزامی است'),
  published: z.boolean(),
  categoryIds: z.array(z.number()).optional(),
  tags: z.array(z.string()).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  publicationId: z.number().optional().nullable(), // ID انتشارات (اختیاری)
});

// تابع GET: دریافت لیست مقالات (با فیلتر و صفحه‌بندی)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const skip = (page - 1) * limit;

    const where: any = { status: 'APPROVED' };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (category && category.toLowerCase() !== "همه") {
      where.categories = {
        some: { name: category },
      };
    }

    const articles = await prisma.article.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: { select: { name: true } },
        _count: { select: { claps: true, comments: true } }, // <-- استفاده از claps
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

// تابع POST: ایجاد یک مقاله جدید
export async function POST(req: Request) {
  const token = cookies().get("token")?.value;
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
      return new NextResponse(validation.error.message, { status: 400 });
    }

    const { title, content, categoryIds, tags = [], coverImageUrl, publicationId } = validation.data;

    // بررسی عضویت کاربر در انتشارات (برای امنیت بیشتر)
    if (publicationId) {
      const membership = await prisma.usersOnPublications.findUnique({
        where: {
          userId_publicationId: { userId, publicationId }
        }
      });
      if (!membership) {
        return new NextResponse("شما عضو این انتشارات نیستید", { status: 403 });
      }
    }

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
        publicationId: publicationId, // اتصال مقاله به انتشارات
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