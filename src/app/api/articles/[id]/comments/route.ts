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

    // 1. Authenticate user
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;
    if (!userId) {
      return new NextResponse("Invalid token payload", { status: 401 });
    }

    // 2. Parse request body for text and parentId
    const { text, parentId } = await req.json();
    if (!text) {
      return new NextResponse("Comment text is required", { status: 400 });
    }

    // 3. Create the comment in the database
    const newComment = await prisma.comment.create({
      data: {
        text,
        userId,
        articleId,
        parentId, // <-- `parentId` اینجا اضافه شد. اگر null باشد، یک کامنت اصلی ثبت می‌شود
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true, // <-- `avatarUrl` کاربر را هم برمی‌گردانیم
          },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
    
  } catch (error) {
    console.error("COMMENT_POST_ERROR", error);
    if (error instanceof Error && error.name === "JWTExpired") {
        return new NextResponse("Token has expired", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}