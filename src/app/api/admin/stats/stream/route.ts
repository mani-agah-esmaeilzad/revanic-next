import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getAdminDashboardStats } from "@/lib/admin/statsService";
import { prisma } from "@/lib/prisma";

const encoder = new TextEncoder();

const sendEvent = (controller: ReadableStreamDefaultController, data: unknown) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
};

const sendHeartbeat = (controller: ReadableStreamDefaultController) => {
  controller.enqueue(encoder.encode(`: keep-alive\n\n`));
};

export async function GET(request: Request) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    let active = true;
    let interval: NodeJS.Timeout | undefined;
    let heartbeat: NodeJS.Timeout | undefined;
    let lastPayload = "";

    const stream = new ReadableStream({
      async start(controller) {
        const pushStats = async (force = false) => {
          const stats = await getAdminDashboardStats();
          const serialized = JSON.stringify(stats);
          if (force || serialized !== lastPayload) {
            lastPayload = serialized;
            sendEvent(controller, stats);
          }
        };

        await pushStats(true);

        interval = setInterval(() => {
          if (!active) return;
          pushStats();
        }, 10000);

        heartbeat = setInterval(() => {
          if (!active) return;
          sendHeartbeat(controller);
        }, 15000);

        const abort = () => {
          active = false;
          if (interval) {
            clearInterval(interval);
          }
          if (heartbeat) {
            clearInterval(heartbeat);
          }
          controller.close();
        };

        request.signal.addEventListener("abort", abort);
      },
      cancel() {
        active = false;
        if (interval) {
          clearInterval(interval);
        }
        if (heartbeat) {
          clearInterval(heartbeat);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("ADMIN_STATS_STREAM_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
