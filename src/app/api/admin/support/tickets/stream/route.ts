import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  SUPPORT_PRIORITY_TEXTS,
  SUPPORT_STATUS_TEXTS,
  type SupportTicketPriorityKey,
  type SupportTicketStatusKey,
} from "@/lib/support";

const encoder = new TextEncoder();

const sendEvent = (controller: ReadableStreamDefaultController, data: unknown) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
};

const sendHeartbeat = (controller: ReadableStreamDefaultController) => {
  controller.enqueue(encoder.encode(`: keep-alive\n\n`));
};

const buildWhere = (
  statusParam: string | null,
  priorityParam: string | null,
  searchTerm: string | null
): Prisma.SupportTicketWhereInput => {
  const where: Prisma.SupportTicketWhereInput = {};

  if (statusParam && SUPPORT_STATUS_TEXTS[statusParam as SupportTicketStatusKey]) {
    where.status = statusParam as SupportTicketStatusKey;
  }

  if (priorityParam && SUPPORT_PRIORITY_TEXTS[priorityParam as SupportTicketPriorityKey]) {
    where.priority = priorityParam as SupportTicketPriorityKey;
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

  return where;
};

const includeConfig = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
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
} satisfies Prisma.SupportTicketInclude;

const mapTicket = (ticket: Prisma.SupportTicketGetPayload<{ include: typeof includeConfig }>) => ({
  ...ticket,
  statusLabel: SUPPORT_STATUS_TEXTS[ticket.status],
  priorityLabel: SUPPORT_PRIORITY_TEXTS[ticket.priority],
});

export async function GET(request: Request) {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const priorityParam = searchParams.get("priority");
  const searchTerm = searchParams.get("q");
  const where = buildWhere(statusParam, priorityParam, searchTerm);

  let active = true;
  let pollingTimer: NodeJS.Timeout | undefined;
  let heartbeatTimer: NodeJS.Timeout | undefined;
  let lastPayload = "";

  const stream = new ReadableStream({
    async start(controller) {
      const pushSnapshot = async (force = false) => {
        const tickets = await prisma.supportTicket.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: includeConfig,
        });
        const mapped = tickets.map(mapTicket);
        const serialized = JSON.stringify(mapped);
        if (force || serialized !== lastPayload) {
          lastPayload = serialized;
          sendEvent(controller, mapped);
        }
      };

      await pushSnapshot(true);

      pollingTimer = setInterval(() => {
        if (!active) return;
        void pushSnapshot();
      }, 5000);

      heartbeatTimer = setInterval(() => {
        if (!active) return;
        sendHeartbeat(controller);
      }, 15000);

      const abort = () => {
        active = false;
        if (pollingTimer) clearInterval(pollingTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        controller.close();
      };

      request.signal.addEventListener("abort", abort);
    },
    cancel() {
      active = false;
      if (pollingTimer) clearInterval(pollingTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
