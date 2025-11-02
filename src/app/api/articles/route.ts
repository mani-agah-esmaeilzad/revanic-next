// src/app/api/articles/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { calculateReadTime } from "@/lib/utils";
import { generateArticleSlug } from "@/lib/article-slug";
import { notifyArticleSubmission } from "@/lib/telegram";

export async function POST(req: Request) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return new NextResponse("Authentication token not found", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const {
      title,
      content,
      tags,
      categoryIds,
      coverImageUrl,
      publicationId,
      published,
    } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (typeof publicationId === "number") {
      const membership = await prisma.usersOnPublications.findUnique({
        where: {
          userId_publicationId: {
            userId: userId,
            publicationId: publicationId,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ message: "You are not a member of this publication." }, { status: 403 });
      }
    }

    const readTime = calculateReadTime(content);

    const slug = await generateArticleSlug(title);

    const status = published ? "PENDING" : "DRAFT";

    const newArticle = await prisma.article.create({
      data: {
        slug,
        title,
        content,
        coverImageUrl,
        readTimeMinutes: readTime,
        authorId: userId,
        publicationId: publicationId,
        status,
        tags: {
          create: tags?.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          })) || [],
        },
        categories: {
          connect: categoryIds?.map((id: number) => ({ id })) || [],
        },
      },
    });

    if (status === "PENDING") {
      notifyArticleSubmission({
        articleId: newArticle.id,
        title: newArticle.title,
        authorId: userId,
      }).catch((error) => {
        console.error("ARTICLE_SUBMISSION_NOTIFY_ERROR", error);
      });
    }

    return NextResponse.json(newArticle, { status: 201 });

  } catch (error) {
    console.error("ARTICLE_CREATION_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
