// src/app/api/articles/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateArticleSlug } from "@/lib/article-slug";
import { requireEditorAccess } from "@/lib/articles/permissions";
import { calculateReadTime } from "@/lib/utils";
import { notifyArticleSubmission } from "@/lib/telegram";

interface JwtPayload {
  userId: number;
}

// UPDATE an article (This function remains unchanged)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return new NextResponse("Authentication token not found", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;
    const articleId = parseInt(params.id, 10);

    if (isNaN(articleId)) {
      return new NextResponse("Invalid article ID", { status: 400 });
    }

    const access = await requireEditorAccess(articleId, userId);
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        authorId: true,
        publicationId: true,
      },
    });

    if (!existingArticle) {
      return new NextResponse("Article not found", { status: 404 });
    }

    const body = (await req.json()) as {
      title?: unknown;
      content?: unknown;
      published?: unknown;
      tags?: unknown;
      categoryIds?: unknown;
      coverImageUrl?: unknown;
      publicationId?: unknown;
    };

    const {
      title,
      content,
      published,
      tags,
      categoryIds,
      coverImageUrl,
      publicationId,
    } = body;

    const data: Prisma.ArticleUpdateInput = {};
    if (typeof title === "string" && title.trim()) {
      data.title = title;
      if (title !== existingArticle.title) {
        data.slug = await generateArticleSlug(title, existingArticle.id);
      }
    }

    if (typeof content === "string") {
      data.content = content;
      data.readTimeMinutes = calculateReadTime(content);
    }

    if (typeof coverImageUrl === "string" || coverImageUrl === null) {
      data.coverImageUrl = coverImageUrl ?? null;
    }

    if (Array.isArray(categoryIds)) {
      const normalizedCategoryIds = categoryIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
      data.categories = {
        set: normalizedCategoryIds.map((id) => ({ id })),
      };
    }

    if (Array.isArray(tags)) {
      const normalizedTags = Array.from(
        new Set(
          tags
            .filter((tag): tag is string => typeof tag === "string")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      );
      data.tags = {
        deleteMany: {},
        create: normalizedTags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: { name: tagName },
            },
          },
        })),
      };
    }

    if (typeof publicationId === "number") {
      const membership = await prisma.usersOnPublications.findUnique({
        where: {
          userId_publicationId: {
            userId,
            publicationId,
          },
        },
      });
      if (!membership) {
        return new NextResponse("You are not a member of this publication.", {
          status: 403,
        });
      }
      data.publication = { connect: { id: publicationId } };
    } else if (publicationId === null) {
      data.publication = { disconnect: true };
    }

    let nextStatus: "PENDING" | "DRAFT" | undefined;
    if (typeof published === "boolean") {
      nextStatus = published ? "PENDING" : "DRAFT";
      data.status = nextStatus;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(existingArticle);
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data,
    });

    if (nextStatus === "PENDING" && existingArticle.status !== "PENDING") {
      notifyArticleSubmission({
        articleId: updatedArticle.id,
        title: updatedArticle.title,
        authorId: access.article.authorId,
      }).catch((error) => {
        console.error("ARTICLE_RESUBMISSION_NOTIFY_ERROR", error);
      });
    }

    return NextResponse.json(updatedArticle);

  } catch (error) {
    console.error("ARTICLE_UPDATE_ERROR", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status?: number }).status ?? 500;
      return new NextResponse(message, { status });
    }
    return new NextResponse(message, { status: 500 });
  }
}

// DELETE an article
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

    // فقط نویسنده مقاله یا ادمین می‌تواند آن را حذف کند
    if (article.authorId !== userId && user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // --- FIX START: Use a transaction to delete dependencies first ---
    await prisma.$transaction(async (tx) => {
      // حذف تمام رکوردهای وابسته
      await tx.clap.deleteMany({ where: { articleId } });
      await tx.comment.deleteMany({ where: { articleId } });
      await tx.bookmark.deleteMany({ where: { articleId } });
      await tx.tagsOnArticles.deleteMany({ where: { articleId } });

      // قطع اتصال دسته‌بندی‌ها
      await tx.article.update({
        where: { id: articleId },
        data: { categories: { set: [] } }
      });

      // در نهایت، حذف خود مقاله
      await tx.article.delete({ where: { id: articleId } });
    });
    // --- FIX END ---

    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    console.error('ARTICLE_DELETE_ERROR', error);
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return new NextResponse('Article to delete does not exist.', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
