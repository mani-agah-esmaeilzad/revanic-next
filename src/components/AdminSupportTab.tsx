// src/components/AdminSupportTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  user: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  messages: SupportMessage[];
}

const statusOptions: { value: SupportTicket["status"]; label: string }[] = [
  { value: "OPEN", label: "باز" },
  { value: "ANSWERED", label: "پاسخ داده شده" },
  { value: "CLOSED", label: "بسته شده" },
];

const statusStyles: Record<SupportTicket["status"], string> = {
  OPEN: "bg-blue-100 text-blue-800",
  ANSWERED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-800",
};

async function fetchAdminTickets(): Promise<SupportTicket[]> {
  const response = await fetch("/api/admin/support/tickets");
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "دریافت تیکت‌ها با خطا مواجه شد.");
  }
  return response.json();
}

interface ReplyInput {
  ticketId: number;
  message?: string;
  status?: SupportTicket["status"];
}

async function replyToTicket(input: ReplyInput): Promise<SupportTicket> {
  const response = await fetch(`/api/admin/support/tickets/${input.ticketId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input.message, status: input.status }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "ارسال پاسخ انجام نشد.");
  }

  return response.json();
}

export const AdminSupportTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [nextStatus, setNextStatus] = useState<SupportTicket["status"] | "">("");

  const {
    data: tickets,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "supportTickets"],
    queryFn: fetchAdminTickets,
  });

  const replyMutation = useMutation({
    mutationFn: replyToTicket,
    onSuccess: () => {
      toast({
        title: "پاسخ ثبت شد",
        description: "پیام شما برای کاربر ارسال شد.",
      });
      setReplyMessage("");
      setNextStatus("");
      queryClient.invalidateQueries({ queryKey: ["admin", "supportTickets"] });
    },
    onError: (err: unknown) => {
      const description = err instanceof Error ? err.message : "لطفاً دوباره تلاش کنید.";
      toast({
        variant: "destructive",
        title: "خطا در ثبت پاسخ",
        description,
      });
    },
  });

  const orderedTickets = useMemo(() => {
    if (!tickets) return [];
    return [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets]);

  useEffect(() => {
    if (!selectedTicketId && orderedTickets.length > 0) {
      setSelectedTicketId(orderedTickets[0].id);
    }
  }, [orderedTickets, selectedTicketId]);

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return orderedTickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  }, [orderedTickets, selectedTicketId]);

  const handleReply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicket) {
      toast({ variant: "destructive", title: "ابتدا یک تیکت را انتخاب کنید." });
      return;
    }

    if (!replyMessage.trim() && !nextStatus) {
      toast({
        variant: "destructive",
        title: "اطلاعات ناقص",
        description: "لطفاً متن پاسخ یا وضعیت جدید را مشخص کنید.",
      });
      return;
    }

    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage.trim() || undefined,
      status: nextStatus || undefined,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>لیست تیکت‌ها</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "خطا در دریافت تیکت‌ها."}
            </div>
          ) : orderedTickets.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">هنوز تیکتی ثبت نشده است.</div>
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="divide-y">
                {orderedTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`flex w-full flex-col items-start gap-2 px-4 py-3 text-right transition ${
                      selectedTicketId === ticket.id ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-journal">{ticket.title}</span>
                      <Badge className={statusStyles[ticket.status]}>{ticket.statusLabel}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ticket.user.name || ticket.user.email}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>جزئیات تیکت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedTicket ? (
            <div className="text-sm text-muted-foreground">
              یکی از تیکت‌های سمت راست را انتخاب کنید تا مکاتبات نمایش داده شود.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-journal">{selectedTicket.title}</p>
                    <p className="text-sm text-muted-foreground">
                      توسط {selectedTicket.user.name || selectedTicket.user.email}
                    </p>
                  </div>
                  <Badge className={statusStyles[selectedTicket.status]}>{selectedTicket.statusLabel}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  تاریخ ثبت: {new Intl.DateTimeFormat("fa-IR", { dateStyle: "full", timeStyle: "short" }).format(new Date(selectedTicket.createdAt))}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-journal">مکالمه</h3>
                <div className="space-y-3">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg border border-border p-4 ${
                        message.authorRole === "ADMIN" ? "bg-muted" : "bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-journal">
                          {message.authorRole === "ADMIN" ? "پشتیبانی" : message.author?.name || "کاربر"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("fa-IR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(message.createdAt))}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-journal-light">{message.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleReply}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-journal">پاسخ پشتیبانی</label>
                  <Textarea
                    rows={4}
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    placeholder="پاسخ خود را برای کاربر بنویسید..."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-journal">وضعیت تیکت:</span>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <Button
                        type="button"
                        key={option.value}
                        variant={nextStatus === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setNextStatus((current) => (current === option.value ? "" : option.value))
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={replyMutation.isPending}>
                    {replyMutation.isPending ? "در حال ارسال..." : "ارسال پاسخ"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
