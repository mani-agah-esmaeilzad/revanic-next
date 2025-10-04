// src/lib/support.ts
export const SUPPORT_STATUS_TEXTS = {
  OPEN: "در انتظار پاسخ",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته شده",
} as const;

export const SUPPORT_PRIORITY_TEXTS = {
  LOW: "کم",
  NORMAL: "معمولی",
  HIGH: "فوری",
} as const;

export type SupportTicketStatusKey = keyof typeof SUPPORT_STATUS_TEXTS;
export type SupportTicketPriorityKey = keyof typeof SUPPORT_PRIORITY_TEXTS;
