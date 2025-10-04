// src/components/AdminSupportTab.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { SupportTicketPriorityKey, SupportTicketStatusKey } from "@/lib/support";

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
  status: SupportTicketStatusKey;
  statusLabel: string;
  priority: SupportTicketPriorityKey;
  priorityLabel: string;
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

const statusOptions: { value: SupportTicketStatusKey; label: string }[] = [
  { value: "OPEN", label: "باز" },
  { value: "ANSWERED", label: "پاسخ داده شده" },
  { value: "CLOSED", label: "بسته شده" },
];

const priorityOptions: { value: SupportTicketPriorityKey; label: string }[] = [
  { value: "HIGH", label: "فوری" },
  { value: "NORMAL", label: "معمولی" },
  { value: "LOW", label: "کم" },
];

const statusStyles: Record<SupportTicketStatusKey, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  ANSWERED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-800",
};

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

interface AdminTicketFilters {
  status?: SupportTicketStatusKey;
  priority?: SupportTicketPriorityKey;
  search?: string;
}

const ALL_FILTER_VALUE = "ALL" as const;
const NO_CHANGE_VALUE = "NONE" as const;

type StatusFilterValue = SupportTicketStatusKey | typeof ALL_FILTER_VALUE;
type PriorityFilterValue = SupportTicketPriorityKey | typeof ALL_FILTER_VALUE;
type StatusUpdateValue = SupportTicketStatusKey | typeof NO_CHANGE_VALUE;
type PriorityUpdateValue = SupportTicketPriorityKey | typeof NO_CHANGE_VALUE;

async function fetchAdminTickets(filters: AdminTicketFilters): Promise<SupportTicket[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("q", filters.search);

  const response = await fetch(
    `/api/admin/support/tickets${params.toString() ? `?${params.toString()}` : ""}`,
    { credentials: "include" }
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "دریافت تیکت‌ها با خطا مواجه شد.");
  }
  return response.json();
}

interface ReplyInput {
  ticketId: number;
  message?: string;
  status?: SupportTicketStatusKey;
  priority?: SupportTicketPriorityKey;
}

async function replyToTicket(input: ReplyInput): Promise<SupportTicket> {
  const response = await fetch(`/api/admin/support/tickets/${input.ticketId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input.message, status: input.status, priority: input.priority }),
    credentials: "include",
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
  const [nextStatus, setNextStatus] = useState<StatusUpdateValue>(NO_CHANGE_VALUE);
  const [nextPriority, setNextPriority] = useState<PriorityUpdateValue>(NO_CHANGE_VALUE);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(ALL_FILTER_VALUE);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterValue>(ALL_FILTER_VALUE);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const sseErrorShownRef = useRef(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const filters = useMemo<AdminTicketFilters>(
    () => ({
      status: statusFilter === ALL_FILTER_VALUE ? undefined : statusFilter,
      priority: priorityFilter === ALL_FILTER_VALUE ? undefined : priorityFilter,
      search: debouncedSearch || undefined,
    }),
    [statusFilter, priorityFilter, debouncedSearch]
  );

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        status: filters.status ?? ALL_FILTER_VALUE,
        priority: filters.priority ?? ALL_FILTER_VALUE,
        search: filters.search ?? "",
      }),
    [filters]
  );

  const {
    data: tickets,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "supportTickets", filtersKey],
    queryFn: () => fetchAdminTickets(filters),
  });

  const replyMutation = useMutation({
    mutationFn: replyToTicket,
    onSuccess: () => {
      toast({
        title: "پاسخ ثبت شد",
        description: "پیام شما برای کاربر ارسال شد.",
      });
      setReplyMessage("");
      setNextStatus(NO_CHANGE_VALUE);
      setNextPriority(NO_CHANGE_VALUE);
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.search) params.set("q", filters.search);

    const source = new EventSource(
      `/api/admin/support/tickets/stream${params.toString() ? `?${params.toString()}` : ""}`
    );

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as SupportTicket[];
      queryClient.setQueryData(["admin", "supportTickets", filtersKey], payload);
      sseErrorShownRef.current = false;
    };

    source.onerror = () => {
      if (!sseErrorShownRef.current) {
        toast({
          variant: "destructive",
          title: "ارتباط زنده قطع شد",
          description: "در حال تلاش برای برقراری مجدد ارتباط با سرور هستیم.",
        });
        sseErrorShownRef.current = true;
      }
    };

    return () => {
      source.close();
    };
  }, [filters, filtersKey, queryClient, toast]);

  const orderedTickets = useMemo(() => {
    if (!tickets) return [];
    return [...tickets].sort((a, b) => {
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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

    const hasStatusChange = nextStatus !== NO_CHANGE_VALUE;
    const hasPriorityChange = nextPriority !== NO_CHANGE_VALUE;

    if (!replyMessage.trim() && !hasStatusChange && !hasPriorityChange) {
      toast({
        variant: "destructive",
        title: "اطلاعات ناقص",
        description: "لطفاً متن پاسخ، وضعیت یا اولویت جدید را مشخص کنید.",
      });
      return;
    }

    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage.trim() || undefined,
      status: hasStatusChange ? nextStatus : undefined,
      priority: hasPriorityChange ? nextPriority : undefined,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>لیست تیکت‌ها</CardTitle>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="وضعیت: همه" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value={ALL_FILTER_VALUE}>همه وضعیت‌ها</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as PriorityFilterValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اولویت: همه" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value={ALL_FILTER_VALUE}>همه اولویت‌ها</SelectItem>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="جستجو در عنوان یا کاربر"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
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
            <ScrollArea className="h-[520px]">
              <div className="divide-y">
                {orderedTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`flex w-full flex-col items-start gap-2 border-r-4 px-4 py-3 text-right transition ${
                      selectedTicketId === ticket.id ? "bg-muted" : "hover:bg-muted/60"
                    } ${
                      ticket.priority === "HIGH"
                        ? "border-red-500"
                        : ticket.priority === "NORMAL"
                        ? "border-amber-400"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-journal">{ticket.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={priorityStyles[ticket.priority]}>{ticket.priorityLabel}</Badge>
                        <Badge className={statusStyles[ticket.status]}>{ticket.statusLabel}</Badge>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                      <span>{ticket.user.name || ticket.user.email}</span>
                      <span>
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(ticket.createdAt))}
                      </span>
                    </div>
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
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-journal">{selectedTicket.title}</p>
                    <p className="text-sm text-muted-foreground">
                      توسط {selectedTicket.user.name || selectedTicket.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityStyles[selectedTicket.priority]}>
                      {selectedTicket.priorityLabel}
                    </Badge>
                    <Badge className={statusStyles[selectedTicket.status]}>{selectedTicket.statusLabel}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  تاریخ ثبت: {new Intl.DateTimeFormat("fa-IR", { dateStyle: "full", timeStyle: "short" }).format(
                    new Date(selectedTicket.createdAt)
                  )}
                </p>
              </div>

              <div className="space-y-4">
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
                      {message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-xs font-medium text-muted-foreground">پیوست‌ها</span>
                          <ul className="space-y-1 text-sm">
                            {message.attachments.map((attachment) => (
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
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleReply}>
                <div className="grid gap-2 md:grid-cols-2">
                  <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as StatusUpdateValue)}>
                    <SelectTrigger>
                      <SelectValue placeholder="تغییر وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CHANGE_VALUE}>بدون تغییر وضعیت</SelectItem>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={nextPriority}
                    onValueChange={(value) => setNextPriority(value as PriorityUpdateValue)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="تغییر اولویت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CHANGE_VALUE}>بدون تغییر اولویت</SelectItem>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-journal">پاسخ پشتیبانی</label>
                  <Textarea
                    rows={4}
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    placeholder="پاسخ خود را برای کاربر بنویسید..."
                  />
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
