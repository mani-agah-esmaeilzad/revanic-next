// src/app/api/admin/support/assistant/conversations/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return NextResponse.json({ message: "دسترسی غیرمجاز." }, { status: 403 });
  }

  try {
    const sessions = await prisma.assistantChatSession.findMany({
      orderBy: { updatedAt: "desc" },
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
        },
        feedback: true,
      },
    });

    type SessionWithRelations = (typeof sessions)[number];
    type SessionMessage = SessionWithRelations["messages"][number];
    const payload = sessions.map((session: SessionWithRelations) => ({
      id: session.id,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      user: session.user,
      messageCount: session.messages.length,
      messages: session.messages.map((message: SessionMessage) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
      feedback: session.feedback
        ? {
            rating: session.feedback.rating,
            comment: session.feedback.comment,
            createdAt: session.feedback.createdAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("ADMIN_ASSISTANT_SESSIONS_ERROR", error);
    return NextResponse.json(
      { message: "دریافت گفتگوهای دستیار با خطا مواجه شد." },
      { status: 500 }
    );
  }
}
