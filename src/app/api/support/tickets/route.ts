// src/app/api/support/tickets/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import {
  SUPPORT_STATUS_TEXTS,
  SUPPORT_PRIORITY_TEXTS,
  type SupportTicketPriorityKey,
} from "@/lib/support";

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const RATE_LIMIT_MAX_TICKETS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

class SlidingWindowRateLimiter {
  private readonly store = new Map<number, number[]>();

  constructor(private readonly limit: number, private readonly windowMs: number) {}

  consume(key: number):
    | { allowed: true }
    | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = this.store.get(key) ?? [];
    const recent = timestamps.filter((ts) => ts > windowStart);

    if (recent.length >= this.limit) {
      this.store.set(key, recent);
      const retryAfterMs = recent[0] + this.windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
    }

    recent.push(now);
    this.store.set(key, recent);
    return { allowed: true };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __supportTicketRateLimiter: SlidingWindowRateLimiter | undefined;
}

const supportTicketRateLimiter =
  globalThis.__supportTicketRateLimiter ??
  (globalThis.__supportTicketRateLimiter = new SlidingWindowRateLimiter(
    RATE_LIMIT_MAX_TICKETS,
    RATE_LIMIT_WINDOW_MS
  ));

const statusTexts = SUPPORT_STATUS_TEXTS;
const priorityTexts = SUPPORT_PRIORITY_TEXTS;

type SupportTicketPriority = SupportTicketPriorityKey;

interface AttachmentPayload {
  url: string;
  mimeType: string;
  size: number;
  filename?: string;
}

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
    const priorityInput = body?.priority as SupportTicketPriority | undefined;
    const attachmentsInput: AttachmentPayload[] = Array.isArray(body?.attachments)
      ? body.attachments
          .map((item: AttachmentPayload) => ({
            url: typeof item?.url === "string" ? item.url : "",
            mimeType: typeof item?.mimeType === "string" ? item.mimeType : "",
            size: Number(item?.size) || 0,
            filename: typeof item?.filename === "string" ? item.filename : undefined,
          }))
          .filter((item: AttachmentPayload) => item.url && item.mimeType && item.size > 0)
      : [];

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

    if (priorityInput && !priorityTexts[priorityInput]) {
      return NextResponse.json(
        { message: "اولویت انتخاب‌شده معتبر نیست." },
        { status: 400 }
      );
    }

    if (attachmentsInput.length > MAX_ATTACHMENTS) {
      return NextResponse.json(
        {
          message: `حداکثر ${MAX_ATTACHMENTS} پیوست برای هر تیکت مجاز است.`,
        },
        { status: 400 }
      );
    }

    const invalidAttachment = attachmentsInput.find((item) => {
      if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(item.mimeType)) {
        return true;
      }
      if (item.size <= 0 || item.size > MAX_ATTACHMENT_SIZE) {
        return true;
      }
      return false;
    });

    if (invalidAttachment) {
      return NextResponse.json(
        {
          message:
            "پیوست نامعتبر است. تنها تصاویر JPEG، PNG یا WebP با حداکثر حجم ۵ مگابایت پذیرفته می‌شوند.",
        },
        { status: 400 }
      );
    }

    const rateAttempt = supportTicketRateLimiter.consume(userId);
    if (!rateAttempt.allowed) {
      const retryAfterMinutes = Math.max(
        1,
        Math.ceil(rateAttempt.retryAfterMs / 60000)
      );
      return NextResponse.json(
        {
          message: `به دلیل ثبت تیکت‌های متعدد، لطفاً پس از ${retryAfterMinutes} دقیقه دوباره تلاش کنید.`,
        },
        { status: 429 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        title: title.trim(),
        userId,
        priority: priorityInput ?? "NORMAL",
        messages: {
          create: {
            body: message.trim(),
            authorId: userId,
            authorRole: "USER",
            attachments:
              attachmentsInput.length > 0
                ? {
                    create: attachmentsInput.map((item) => ({
                      url: item.url,
                      mimeType: item.mimeType,
                      size: item.size,
                      filename: item.filename,
                    })),
                  }
                : undefined,
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
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...ticket,
        statusLabel: statusTexts[ticket.status],
        priorityLabel: priorityTexts[ticket.priority],
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
