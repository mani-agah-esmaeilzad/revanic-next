// src/app/api/articles/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return new NextResponse("Authentication token not found", { status: 401 });
  }

  try {
    const articleId = parseInt(params.id, 10);
    if (isNaN(articleId)) {
      return new NextResponse("Invalid article ID", { status: 400 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number; // This is the actor

    const { text, parentId } = await req.json();
    if (!text) {
      return new NextResponse("Comment text is required", { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        text,
        userId,
        articleId,
        parentId,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        article: { select: { title: true } } // Include article title for the notification
      },
    });

    // =======================================================================
    // --- تغییر اصلی در این بخش اعمال شده است ---
    // =======================================================================
    // If the comment is a reply (has a parentId), create a notification
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true } // We only need the ID of the original commenter
      });

      // Ensure we're not notifying the user about their own reply
      // and the parent comment exists
      if (parentComment && parentComment.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: 'COMMENT_REPLY',
            message: `${newComment.user.name || 'کاربری'} به نظر شما در مقاله "${newComment.article.title}" پاسخ داد.`,
            userId: parentComment.userId, // The user to notify
            actorId: userId,               // The user who replied
            articleId: articleId,
          }
        });
      }
    }
    // =======================================================================

    // Return only the necessary comment data to the client
    const { article, ...commentResponse } = newComment;

    return NextResponse.json(commentResponse, { status: 201 });

  } catch (error) {
    console.error("COMMENT_POST_ERROR", error);
    if (error instanceof Error && error.name === "JWTExpired") {
      return new NextResponse("Token has expired", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}