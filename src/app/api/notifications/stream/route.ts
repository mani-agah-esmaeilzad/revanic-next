import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getNotificationsSnapshot } from "@/lib/notifications";

const encoder = new TextEncoder();

const sendEvent = (controller: ReadableStreamDefaultController, data: unknown) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
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

    let lastNotificationId: number | null = null;
    let active = true;
    let interval: NodeJS.Timeout | undefined;

    const stream = new ReadableStream({
      async start(controller) {
        const pushSnapshot = async () => {
          const snapshot = await getNotificationsSnapshot(userId);
          if (snapshot.notifications.length > 0) {
            lastNotificationId = snapshot.notifications[0]?.id ?? lastNotificationId;
          }
          sendEvent(controller, snapshot);
        };

        await pushSnapshot();

        interval = setInterval(async () => {
          if (!active) return;
          const snapshot = await getNotificationsSnapshot(userId);
          const newestId = snapshot.notifications[0]?.id ?? null;
          if (newestId && newestId !== lastNotificationId) {
            lastNotificationId = newestId;
            sendEvent(controller, snapshot);
          }
        }, 5000);

        const abort = () => {
          active = false;
          clearInterval(interval);
          controller.close();
        };

        request.signal.addEventListener("abort", abort);
      },
      cancel() {
        active = false;
        if (interval) {
          clearInterval(interval);
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
    console.error("NOTIFICATION_STREAM_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
