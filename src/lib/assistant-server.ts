// src/lib/assistant-server.ts
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getUserIdFromSessionCookie } from "@/lib/auth-session";
import {
  ASSISTANT_SESSION_COOKIE,
  type AssistantSessionDTO,
} from "@/lib/assistant";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function loadOrCreateAssistantSession() {
  const cookieStore = cookies();
  const existingSessionId = Number(cookieStore.get(ASSISTANT_SESSION_COOKIE)?.value ?? "");

  let session =
    Number.isInteger(existingSessionId) && existingSessionId > 0
      ? await prisma.assistantChatSession.findUnique({
          where: { id: existingSessionId },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            feedback: true,
          },
        })
      : null;

  if (!session) {
    const userId = await getUserIdFromSessionCookie();
    session = await prisma.assistantChatSession.create({
      data: {
        userId: userId ?? undefined,
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        feedback: true,
      },
    });

    cookieStore.set({
      name: ASSISTANT_SESSION_COOKIE,
      value: String(session.id),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  return session;
}

export function mapSessionToDto(session: Awaited<ReturnType<typeof loadOrCreateAssistantSession>>): AssistantSessionDTO {
  return {
    id: session.id,
    status: session.status,
    messages: session.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
    hasFeedback: Boolean(session.feedback),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
