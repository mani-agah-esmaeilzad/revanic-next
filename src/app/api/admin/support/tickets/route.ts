// src/app/api/admin/support/tickets/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const statusTexts = {
  OPEN: "در انتظار پاسخ",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته شده",
};

interface AdminPayload {
  userId?: number;
  role?: string;
}

async function requireAdmin() {
  const token = cookies().get("token")?.value;
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const adminPayload = payload as AdminPayload;
    if (adminPayload.role === "ADMIN" && typeof adminPayload.userId === "number") {
      return adminPayload.userId;
    }
    return null;
  } catch (error) {
    console.error("ADMIN_SUPPORT_AUTH_ERROR", error);
    return null;
  }
}

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ message: "دسترسی غیرمجاز." }, { status: 403 });
  }

  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
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
    console.error("ADMIN_SUPPORT_FETCH_ERROR", error);
    return NextResponse.json(
      { message: "خطا در دریافت تیکت‌های پشتیبانی." },
      { status: 500 }
    );
  }
}
