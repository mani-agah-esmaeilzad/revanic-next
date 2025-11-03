// src/lib/email.ts
interface SeriesReleaseEmailPayload {
  to: string;
  recipientName: string;
  seriesTitle: string;
  articleTitle: string;
  articleUrl: string;
}

interface EmailResult {
  delivered: boolean;
  id?: string;
  error?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'no-reply@revanac.local';

export async function sendSeriesReleaseEmail(payload: SeriesReleaseEmailPayload): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.info('[EMAIL] RESEND_API_KEY تنظیم نشده است. پیام زیر ارسال نشد:', payload);
    return { delivered: false, error: 'RESEND_API_KEY missing' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: payload.to,
      subject: `قسمت جدید سری ${payload.seriesTitle}`,
      html: `
        <p>سلام ${payload.recipientName} عزیز،</p>
        <p>قسمت تازه‌ای از سری <strong>${payload.seriesTitle}</strong> با عنوان
        «${payload.articleTitle}» منتشر شده است.</p>
        <p>برای مطالعه قسمت جدید، <a href="${payload.articleUrl}">اینجا کلیک کنید</a>.</p>
        <p>با آرزوی مطالعه‌ای لذت‌بخش 💚</p>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[EMAIL] Resend error', error);
    return { delivered: false, error };
  }

  const json = (await response.json().catch(() => ({}))) as { id?: string };
  return { delivered: true, id: json.id };
}
