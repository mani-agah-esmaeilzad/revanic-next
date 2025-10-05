// src/app/api/support/assistant/messages/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  ASSISTANT_SYSTEM_PROMPT,
  GEMINI_FLASH_MODEL,
} from "@/lib/assistant";
import {
  loadOrCreateAssistantSession,
  mapSessionToDto,
} from "@/lib/assistant-server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const MAX_USER_MESSAGE_LENGTH = 2000;

function mapRoleToGemini(role: "USER" | "ASSISTANT" | "SYSTEM") {
  switch (role) {
    case "ASSISTANT":
      return "model";
    case "SYSTEM":
      return "system";
    default:
      return "user";
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "کلید دسترسی Google AI تنظیم نشده است. مقدار GOOGLE_GENAI_API_KEY را در محیط اجرا تعریف کنید.",
      },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "درخواست نامعتبر است." }, { status: 400 });
  }

  type MessagePayload = { message?: unknown };
  const maybeMessage = (body as MessagePayload | null | undefined)?.message;
  const message = typeof maybeMessage === "string" ? maybeMessage.trim() : "";

  if (!message) {
    return NextResponse.json(
      { message: "متن پیام نمی‌تواند خالی باشد." },
      { status: 400 }
    );
  }

  const safeMessage = message.slice(0, MAX_USER_MESSAGE_LENGTH);

  const session = await loadOrCreateAssistantSession();

  await prisma.assistantChatMessage.create({
    data: {
      sessionId: session.id,
      role: "USER",
      content: safeMessage,
    },
  });

  const history = await prisma.assistantChatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  const contents = history.map((item) => ({
    role: mapRoleToGemini(item.role),
    parts: [{ text: item.content }],
  }));

  let assistantReply = "";

  try {
    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_FLASH_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: ASSISTANT_SYSTEM_PROMPT }],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      console.error("GEMINI_GENERATION_ERROR", errorPayload);
      throw new Error("خطا در دریافت پاسخ از دستیار هوشمند.");
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    assistantReply =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text ?? "")
        .join("\n")
        .trim() ?? "";
  } catch (error) {
    console.error("AI_ASSISTANT_REPLY_ERROR", error);
    assistantReply =
      "متأسفم، در حال حاضر نمی‌توانم پاسخ دقیقی ارائه دهم. لطفاً بعداً دوباره تلاش کنید یا از پشتیبانی انسانی کمک بگیرید.";
  }

  if (!assistantReply) {
    assistantReply =
      "برای پاسخ دقیق‌تر به اطلاعات بیشتری نیاز دارم. لطفاً جزئیات سوال خود را بیشتر توضیح دهید.";
  }

  await prisma.assistantChatMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      content: assistantReply,
    },
  });

  const updatedSession = await prisma.assistantChatSession.update({
    where: { id: session.id },
    data: {
      status: "ACTIVE",
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      feedback: true,
    },
  });

  return NextResponse.json(mapSessionToDto(updatedSession));
}
