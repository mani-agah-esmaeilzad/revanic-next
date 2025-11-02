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
    "🔔 *درخواست بررسی مقاله جدید*",
    "",
    `عنوان: *${escapeMarkdown(title)}*`,
    `نویسنده: ${escapeMarkdown(authorName)} (ID: ${authorId})`,
    "",
    "برای تأیید یا رد مقاله به پنل مدیریت مراجعه کنید.",
  ].join("\n");
};

const escapeMarkdown = (value: string) =>
  value.replace(/([_*[\]()~`>#+-=|{}.!\\])/g, "\\$1");

export const notifyArticleSubmission = async (payload: ArticleNotificationPayload) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    return;
  }

  try {
    const text = await buildMessage(payload);
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text,
        parse_mode: "MarkdownV2",
      }),
    });
  } catch (error) {
    console.error("TELEGRAM_NOTIFICATION_ERROR", error);
  }
};
