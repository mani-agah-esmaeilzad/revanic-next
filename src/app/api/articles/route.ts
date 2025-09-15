import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

interface JwtPayload {
  userId: number;
}

// GET articles with optional search and category filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  const where: any = { published: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  // Note: This assumes category is a string on the article, not a relation.
  // If it were a relation, the query would be: { categories: { some: { name: category } } }
  // Based on the schema, it IS a relation, so let's query it correctly.
  if (category && category.toLowerCase() !== "همه") {
    where.categories = {
      some: { name: category },
    };
  }

  try {
    const articles = await prisma.article.findMany({
      where,
      include: {
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
        categories: { select: { name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(articles);
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
    const userId = (payload as JwtPayload).userId;

    const body = await req.json();
    const { title, content, published = false } = body;

    if (!title || !content) {
      return new NextResponse("Title and content are required", {
        status: 400,
      });
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        published,
        authorId: userId,
      },
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "JWTExpired") {
      return new NextResponse("Token expired", { status: 401 });
    }
    console.error("ARTICLE_CREATION_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
