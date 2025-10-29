import { prisma } from "@/lib/prisma";

export async function getNotificationsSnapshot(userId: number) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      include: {
        actor: { select: { id: true, name: true } },
        article: { select: { id: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, unreadCount };
}
