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

interface SupportAuthor {
  id: number;
  name: string | null;
  role: string | null;
  avatarUrl: string | null;
}

interface SupportMessage {
  id: number;
  body: string;
  authorRole: "USER" | "ADMIN";
  createdAt: string;
  author: SupportAuthor | null;
}

interface SupportTicket {
  id: number;
  title: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  statusLabel: string;
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

async function fetchTickets(): Promise<SupportTicket[]> {
  const response = await fetch("/api/support/tickets");
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "خطا در دریافت تیکت‌ها");
  }
  return response.json();
}

interface CreateTicketInput {
  title: string;
  message: string;
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

export const SupportCenter = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

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
    return [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "اطلاعات ناقص",
        description: "لطفاً عنوان و متن پیام را کامل کنید.",
      });
      return;
    }
    createTicketMutation.mutate({ title: title.trim(), message: message.trim() });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-journal">پشتیبانی روانیک</h1>
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
            <div>
              <label className="mb-2 block text-sm font-medium text-journal">متن پیام</label>
              <Textarea
                rows={5}
                placeholder="توضیح دهید چه مشکلی دارید یا چه انتظاری از تیم پشتیبانی دارید."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? "در حال ارسال..." : "ثبت تیکت"}
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
              <Card key={ticket.id}>
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
                    <Badge className={statusStyles[ticket.status]}>{ticket.statusLabel}</Badge>
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
