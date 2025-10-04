// src/app/api/admin/support/tickets/[id]/reply/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import type { Prisma, SupportTicketStatus } from "@prisma/client";

const statusTexts = {
  OPEN: "در انتظار پاسخ",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته شده",
};

const allowedStatuses: SupportTicketStatus[] = ["OPEN", "ANSWERED", "CLOSED"];

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
    console.error("ADMIN_SUPPORT_REPLY_AUTH_ERROR", error);
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ message: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const ticketId = Number(params.id);
  if (!ticketId || Number.isNaN(ticketId)) {
    return NextResponse.json({ message: "شناسه تیکت نامعتبر است." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const message: string | undefined = body?.message?.trim();
    const status = body?.status as SupportTicketStatus | undefined;

    if (!message && !status) {
      return NextResponse.json(
        { message: "لطفاً متن پاسخ یا وضعیت جدید را ارسال کنید." },
        { status: 400 }
      );
    }

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: "وضعیت انتخاب شده معتبر نیست." },
        { status: 400 }
      );
    }

    const ticketExists = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticketExists) {
      return NextResponse.json(
        { message: "تیکت مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (message) {
        await tx.supportMessage.create({
          data: {
            ticketId,
            body: message,
            authorRole: "ADMIN",
            authorId: adminId,
          },
        });
      }

      const updateData: Prisma.SupportTicketUpdateInput = {
        updatedAt: new Date(),
      };

      if (status) {
        updateData.status = status;
      }

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
      });
    });

    const refreshedTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
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

    return NextResponse.json({
      ...refreshedTicket,
      statusLabel: refreshedTicket ? statusTexts[refreshedTicket.status] : undefined,
    });
  } catch (error) {
    console.error("ADMIN_SUPPORT_REPLY_ERROR", error);
    return NextResponse.json(
      { message: "ارسال پاسخ با خطا مواجه شد." },
      { status: 500 }
    );
  }
}
