import { prisma } from "./prisma";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

interface ArticleNotificationPayload {
  articleId: number;
  title: string;
  authorId: number;
}

const buildMessage = async ({ articleId, title, authorId }: ArticleNotificationPayload) => {
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { name: true },
  });

  const authorName = author?.name || "کاربر ناشناس";
  return [
    `<b>🔔 درخواست بررسی مقاله جدید</b>`,
    "",
    `عنوان: <b>${escapeHtml(title)}</b>`,
    `نویسنده: ${escapeHtml(authorName)} – شناسه: <code>${authorId}</code>`,
    "",
    "برای تأیید یا رد مقاله به پنل مدیریت مراجعه کنید.",
  ].join("\n");
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const notifyArticleSubmission = async (payload: ArticleNotificationPayload) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    return;
  }

  try {
    const text = await buildMessage(payload);
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API responded with ${response.status}: ${errorText}`);
    }

    const payloadResult = await response.json();
    if (!payloadResult.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(payloadResult)}`);
    }
  } catch (error) {
    console.error("TELEGRAM_NOTIFICATION_ERROR", error);
  }
};
