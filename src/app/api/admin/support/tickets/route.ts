// src/app/api/admin/support/tickets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  SUPPORT_STATUS_TEXTS,
  SUPPORT_PRIORITY_TEXTS,
  type SupportTicketPriorityKey,
  type SupportTicketStatusKey,
} from "@/lib/support";
import type { Prisma } from "@prisma/client";

const statusTexts = SUPPORT_STATUS_TEXTS;
const priorityTexts = SUPPORT_PRIORITY_TEXTS;

type SupportTicketStatus = SupportTicketStatusKey;
type SupportTicketPriority = SupportTicketPriorityKey;

export async function GET(request: Request) {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return NextResponse.json({ message: "دسترسی غیرمجاز." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const searchTerm = searchParams.get("q");

    const where: Prisma.SupportTicketWhereInput = {};

    if (statusParam && statusTexts[statusParam as SupportTicketStatus]) {
      where.status = statusParam as SupportTicketStatus;
    }

    if (priorityParam && priorityTexts[priorityParam as SupportTicketPriority]) {
      where.priority = priorityParam as SupportTicketPriority;
    }

    if (searchTerm?.trim()) {
      where.OR = [
        { title: { contains: searchTerm.trim(), mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: searchTerm.trim(), mode: "insensitive" } },
              { email: { contains: searchTerm.trim(), mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
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
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json(
      tickets.map((ticket) => ({
        ...ticket,
        statusLabel: statusTexts[ticket.status],
        priorityLabel: priorityTexts[ticket.priority],
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
