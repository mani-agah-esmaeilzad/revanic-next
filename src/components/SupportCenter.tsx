// src/components/SupportCenter.tsx
"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SupportTicketPriorityKey } from "@/lib/support";

interface SupportAuthor {
  id: number;
  name: string | null;
  role: string | null;
  avatarUrl: string | null;
}

interface SupportAttachment {
  id: number;
  url: string;
  mimeType: string;
  size: number;
  filename: string | null;
  createdAt: string;
}

interface SupportMessage {
  id: number;
  body: string;
  authorRole: "USER" | "ADMIN";
  createdAt: string;
  author: SupportAuthor | null;
  attachments: SupportAttachment[];
}

interface SupportTicket {
  id: number;
  title: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  statusLabel: string;
  priority: SupportTicketPriorityKey;
  priorityLabel: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

const statusStyles: Record<SupportTicket["status"], string> = {
  OPEN: "bg-blue-100 text-blue-800",
  ANSWERED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-800",
};

const statusDescriptions: Record<SupportTicket["status"], string> = {
  OPEN: "در انتظار بررسی تیم پشتیبانی",
  ANSWERED: "پاسخ از سوی تیم پشتیبانی ثبت شده است",
  CLOSED: "این تیکت بسته شده است",
};

const priorityOptions: { value: SupportTicketPriorityKey; label: string; description: string }[] = [
  { value: "HIGH", label: "فوری", description: "رسیدگی در سریع‌ترین زمان ممکن" },
  { value: "NORMAL", label: "معمولی", description: "رسیدگی در نوبت استاندارد" },
  { value: "LOW", label: "کم", description: "پیشنهاد یا درخواست غیر فوری" },
];

const priorityStyles: Record<SupportTicketPriorityKey, string> = {
  HIGH: "bg-red-100 text-red-800",
  NORMAL: "bg-amber-100 text-amber-800",
  LOW: "bg-slate-100 text-slate-800",
};

const priorityWeight: Record<SupportTicketPriorityKey, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

const MAX_ATTACHMENTS = 3;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function fetchTickets(): Promise<SupportTicket[]> {
  const response = await fetch("/api/support/tickets");
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "خطا در دریافت تیکت‌ها");
  }
  return response.json();
}

interface TicketAttachmentPayload {
  url: string;
  mimeType: string;
  size: number;
  filename?: string;
}

interface CreateTicketInput {
  title: string;
  message: string;
  priority: SupportTicketPriorityKey;
  attachments: TicketAttachmentPayload[];
}

async function createTicket(input: CreateTicketInput): Promise<SupportTicket> {
  const response = await fetch("/api/support/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "ثبت تیکت با خطا مواجه شد");
  }

  return response.json();
}

async function uploadAttachment(file: File): Promise<TicketAttachmentPayload> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "خطای ناشناخته" }));
    throw new Error(payload?.error ?? "آپلود فایل ناموفق بود");
  }

  const { url } = (await response.json()) as { url?: string };
  if (!url) {
    throw new Error("آدرس فایل بارگذاری‌شده دریافت نشد.");
  }
  return {
    url,
    mimeType: file.type,
    size: file.size,
    filename: file.name,
  };
}

export const SupportCenter = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<SupportTicketPriorityKey>("NORMAL");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: tickets, isLoading, isError, error } = useQuery({
    queryKey: ["supportTickets"],
    queryFn: fetchTickets,
  });

  const createTicketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      toast({
        title: "تیکت شما ثبت شد",
        description: "همکاران ما در سریع‌ترین زمان ممکن پاسخ خواهند داد.",
      });
      setTitle("");
      setMessage("");
      setPriority("NORMAL");
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
    onError: (err: unknown) => {
      const description = err instanceof Error ? err.message : "لطفاً دوباره تلاش کنید.";
      toast({
        variant: "destructive",
        title: "خطا در ثبت تیکت",
        description,
      });
    },
  });

  const sortedTickets = useMemo(() => {
    if (!tickets) return [];
    return [...tickets].sort((a, b) => {
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tickets]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files ?? []);
    if (incomingFiles.length === 0) return;

    const exceedsLimit = files.length + incomingFiles.length > MAX_ATTACHMENTS;
    if (exceedsLimit) {
      toast({
        variant: "destructive",
        title: "حداکثر تعداد پیوست",
        description: `امکان بارگذاری بیش از ${MAX_ATTACHMENTS} فایل وجود ندارد.`,
      });
    }

    const allowed = incomingFiles.filter((file) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "فرمت پشتیبانی نمی‌شود",
          description: `${file.name} فرمت مجاز نیست.`,
        });
        return false;
      }
      return true;
    });

    const spaceLeft = MAX_ATTACHMENTS - files.length;
    setFiles((prev) => [...prev, ...allowed.slice(0, spaceLeft)]);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "اطلاعات ناقص",
        description: "لطفاً عنوان و متن پیام را کامل کنید.",
      });
      return;
    }

    setIsUploading(true);
    let uploadedAttachments: TicketAttachmentPayload[] = [];
    try {
      uploadedAttachments = await Promise.all(files.map((file) => uploadAttachment(file)));
    } catch (uploadError) {
      const description = uploadError instanceof Error ? uploadError.message : "خطا در آپلود پیوست";
      toast({
        variant: "destructive",
        title: "ارسال تیکت ناموفق بود",
        description,
      });
      setIsUploading(false);
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        priority,
        attachments: uploadedAttachments,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-journal">پشتیبانی روانک</h1>
        <p className="text-muted-foreground">
          اگر سوال، مشکل یا پیشنهادی دارید، از این بخش برای ارتباط مستقیم با تیم پشتیبانی استفاده کنید.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ارسال درخواست جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-journal">عنوان تیکت</label>
              <Input
                placeholder="مثلاً مشکل در انتشار مقاله"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-journal">اولویت رسیدگی</label>
              <Select value={priority} onValueChange={(value) => setPriority(value as SupportTicketPriorityKey)}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب اولویت" />
                </SelectTrigger>
                <SelectContent align="end">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col items-start">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-journal">متن پیام</label>
              <Textarea
                rows={5}
                placeholder="توضیح دهید چه مشکلی دارید یا چه انتظاری از تیم پشتیبانی دارید."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">پیوست (حداکثر {MAX_ATTACHMENTS} تصویر)</label>
              <Input type="file" accept={ALLOWED_MIME_TYPES.join(",")} multiple onChange={handleFileSelection} />
              {files.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-4">
                      <span className="truncate">
                        {file.name} ({Math.max(1, Math.round(file.size / 1024))} کیلوبایت)
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        حذف
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={createTicketMutation.isPending || isUploading}>
                {createTicketMutation.isPending || isUploading ? "در حال ارسال..." : "ثبت تیکت"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-journal">تیکت‌های شما</h2>
          <span className="text-sm text-muted-foreground">
            همه مکاتبات شما با تیم پشتیبانی در اینجا نمایش داده می‌شود.
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">
              {error instanceof Error ? error.message : "دریافت تیکت‌ها با خطا مواجه شد."}
            </CardContent>
          </Card>
        ) : sortedTickets.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              هنوز تیکتی ثبت نکرده‌اید.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`border-r-4 ${
                  ticket.priority === "HIGH"
                    ? "border-red-500"
                    : ticket.priority === "NORMAL"
                    ? "border-amber-500"
                    : "border-transparent"
                }`}
              >
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "full",
                        timeStyle: "short",
                      }).format(new Date(ticket.createdAt))}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="flex items-center gap-2">
                      <Badge className={priorityStyles[ticket.priority]}>{ticket.priorityLabel}</Badge>
                      <Badge className={statusStyles[ticket.status]}>{ticket.statusLabel}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{priorityOptions.find((option) => option.value === ticket.priority)?.description}</span>
                    <span className="text-xs text-muted-foreground">{statusDescriptions[ticket.status]}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticket.messages.map((messageItem) => (
                    <div
                      key={messageItem.id}
                      className={`rounded-lg border border-border p-4 ${
                        messageItem.authorRole === "ADMIN" ? "bg-muted" : "bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-journal">
                          {messageItem.authorRole === "ADMIN" ? "پاسخ پشتیبانی" : "پیام شما"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("fa-IR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(messageItem.createdAt))}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-journal-light">{messageItem.body}</p>
                      {messageItem.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-xs font-medium text-muted-foreground">پیوست‌ها</span>
                          <ul className="space-y-1 text-sm">
                            {messageItem.attachments.map((attachment) => (
                              <li key={attachment.id}>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  {attachment.filename || "دانلود فایل"}
                                </a>
                                <span className="mr-2 text-xs text-muted-foreground">
                                  ({Math.max(1, Math.round(attachment.size / 1024))} کیلوبایت)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
