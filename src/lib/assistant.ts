// src/lib/assistant.ts
import type {
  AssistantChatMessageRole,
  AssistantChatStatus,
} from "@prisma/client";

export const ASSISTANT_SESSION_COOKIE = "assistant_session_id";

export const GEMINI_FLASH_MODEL = "models/gemini-2.0-flash-exp";

export const ASSISTANT_SYSTEM_PROMPT = `شما دستیار هوشمند روانک هستید. با لحن مودبانه و دوستانه به فارسی پاسخ دهید.
- در پاسخ‌ها به خدمات وب‌سایت روانک (پلتفرم تولید و مطالعهٔ مقاله‌های فارسی) ارجاع دهید.
- اگر اطلاعات دقیق ندارید، پیشنهاد دهید کاربر با تیم پشتیبانی انسانی تماس بگیرد یا تیکت ثبت کند.
- پاسخ‌های کوتاه اما کاربردی ارائه کنید و در صورت نیاز فهرست مراحل را شماره‌گذاری نمایید.`;

export interface AssistantMessageDTO {
  id: number;
  role: AssistantChatMessageRole;
  content: string;
  createdAt: string;
}

export interface AssistantSessionDTO {
  id: number;
  status: AssistantChatStatus;
  messages: AssistantMessageDTO[];
  hasFeedback: boolean;
  createdAt: string;
  updatedAt: string;
}
