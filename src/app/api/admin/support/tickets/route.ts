// src/app/api/admin/support/tickets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const statusTexts = {
  OPEN: "در انتظار پاسخ",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته شده",
};

export async function GET() {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
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
