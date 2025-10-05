// src/app/api/support/assistant/feedback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { ASSISTANT_SESSION_COOKIE } from "@/lib/assistant";
import { mapSessionToDto } from "@/lib/assistant-server";

const COMMENT_MAX_LENGTH = 600;

export async function POST(request: Request) {
  const cookieStore = cookies();
  const sessionId = Number(cookieStore.get(ASSISTANT_SESSION_COOKIE)?.value ?? "");

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return NextResponse.json(
      { message: "جلسهٔ گفت‌وگو پیدا نشد." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "درخواست نامعتبر است." }, { status: 400 });
  }

  const ratingInput = (body as { rating?: number })?.rating;
  const commentInput = (body as { comment?: string })?.comment;

  let rating: number | null = null;
  if (typeof ratingInput === "number" && Number.isFinite(ratingInput)) {
    rating = Math.round(ratingInput);
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "امتیاز باید بین ۱ تا ۵ باشد." },
        { status: 400 }
      );
    }
  } else if (ratingInput != null) {
    return NextResponse.json(
      { message: "امتیاز نامعتبر است." },
      { status: 400 }
    );
  }

  const comment = typeof commentInput === "string" ? commentInput.trim().slice(0, COMMENT_MAX_LENGTH) : undefined;

  const session = await prisma.assistantChatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      feedback: true,
    },
  });

  if (!session) {
    return NextResponse.json(
      { message: "جلسهٔ گفت‌وگو پیدا نشد." },
      { status: 404 }
    );
  }

  if (session.messages.length === 0) {
    return NextResponse.json(
      { message: "برای ثبت بازخورد ابتدا گفتگو را آغاز کنید." },
      { status: 400 }
    );
  }

  await prisma.assistantChatFeedback.upsert({
    where: { sessionId },
    update: {
      rating: rating ?? undefined,
      comment: comment ?? session.feedback?.comment ?? undefined,
    },
    create: {
      sessionId,
      rating: rating ?? undefined,
      comment,
    },
  });

  const updatedSession = await prisma.assistantChatSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      feedback: true,
    },
  });

  return NextResponse.json(mapSessionToDto(updatedSession));
}
