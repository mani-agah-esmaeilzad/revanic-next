// src/app/api/support/tickets/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const statusTexts = {
  OPEN: "در انتظار پاسخ",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته شده",
};

async function getAuthenticatedUserId() {
  const token = cookies().get("token")?.value;
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.userId === "number" ? payload.userId : null;
  } catch (error) {
    console.error("SUPPORT_TICKETS_AUTH_ERROR", error);
    return null;
  }
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { message: "دسترسی غیرمجاز." },
      { status: 401 }
    );
  }

  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      tickets.map((ticket) => ({
        ...ticket,
        statusLabel: statusTexts[ticket.status],
      }))
    );
  } catch (error) {
    console.error("SUPPORT_TICKETS_FETCH_ERROR", error);
    return NextResponse.json(
      { message: "خطا در دریافت تیکت‌ها." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { message: "دسترسی غیرمجاز." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const title: string = body?.title;
    const message: string = body?.message;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { message: "عنوان تیکت نمی‌تواند خالی باشد." },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { message: "متن پیام نمی‌تواند خالی باشد." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        title: title.trim(),
        userId,
        messages: {
          create: {
            body: message.trim(),
            authorId: userId,
            authorRole: "USER",
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...ticket,
        statusLabel: statusTexts[ticket.status],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SUPPORT_TICKETS_CREATE_ERROR", error);
    return NextResponse.json(
      { message: "در ثبت تیکت خطایی رخ داد." },
      { status: 500 }
    );
  }
}
