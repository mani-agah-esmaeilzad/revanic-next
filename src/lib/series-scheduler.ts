// src/lib/series-scheduler.ts
import { prisma } from '@/lib/prisma';
import { sendSeriesReleaseEmail } from '@/lib/email';

interface ReleaseResult {
  released: number;
  notifications: number;
  emailAttempts: number;
  emailDelivered: number;
}

export async function processSeriesReleaseQueue(): Promise<ReleaseResult> {
  const now = new Date();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BASE_URL ?? '';

  const dueEntries = await prisma.seriesArticle.findMany({
    where: {
      releaseAt: { not: null, lte: now },
      releasedAt: null,
    },
    include: {
      series: {
        select: {
          id: true,
          title: true,
          slug: true,
          followers: {
            select: {
              userId: true,
              notifyByEmail: true,
              user: { select: { email: true, name: true } },
            },
          },
        },
      },
      article: {
        select: {
          id: true,
          title: true,
          authorId: true,
        },
      },
    },
  });

  if (dueEntries.length === 0) {
    return { released: 0, notifications: 0, emailAttempts: 0, emailDelivered: 0 };
  }

  let released = 0;
  let notifications = 0;
  let emailAttempts = 0;
  let emailDelivered = 0;

  for (const entry of dueEntries) {
    const releaseTime = new Date();
    const { series, article } = entry;

    await prisma.$transaction(async (tx) => {
      await tx.seriesArticle.update({
        where: { id: entry.id },
        data: {
          releasedAt: releaseTime,
          notifiedAt: releaseTime,
        },
      });

      if (series.followers.length > 0) {
        await tx.notification.createMany({
          data: series.followers.map((follower) => ({
            type: 'SERIES_RELEASE',
            message: `قسمت جدید «${article.title}» در سری «${series.title}» منتشر شد.`,
            userId: follower.userId,
            actorId: article.authorId,
            articleId: article.id,
          })),
        });
        notifications += series.followers.length;
      }
    });

    released += 1;

    for (const follower of series.followers) {
      if (!follower.notifyByEmail) continue;
      const email = follower.user?.email;
      if (!email) continue;

      emailAttempts += 1;
      try {
        const response = await sendSeriesReleaseEmail({
          to: email,
          recipientName: follower.user?.name ?? 'دوست عزیز',
          seriesTitle: series.title,
          articleTitle: article.title,
          articleUrl: baseUrl ? `${baseUrl}/articles/${article.id}` : `/articles/${article.id}`,
        });
        if (response?.delivered) {
          emailDelivered += 1;
        }
      } catch (error) {
        console.error('SERIES_RELEASE_EMAIL_ERROR', error);
      }
    }
  }

  return { released, notifications, emailAttempts, emailDelivered };
}
