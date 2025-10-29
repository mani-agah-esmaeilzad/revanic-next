// src/components/SupportAssistantWidget.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Star, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { AssistantSessionDTO } from "@/lib/assistant";

async function fetchAssistantSession(): Promise<AssistantSessionDTO> {
  const response = await fetch("/api/support/assistant/session", {
    credentials: "include",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "بارگذاری دستیار با خطا مواجه شد.");
  }
  return response.json();
}

async function sendAssistantMessage(message: string): Promise<AssistantSessionDTO> {
  const response = await fetch("/api/support/assistant/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(payload?.message ?? "ارسال پیام انجام نشد.");
  }
  return response.json();
}

interface FeedbackPayload {
  rating?: number | null;
  comment?: string;
}

async function submitAssistantFeedback(payload: FeedbackPayload): Promise<AssistantSessionDTO> {
  const response = await fetch("/api/support/assistant/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(body?.message ?? "ثبت نظر انجام نشد.");
  }
  return response.json();
}

function formatTime(timestamp: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

export function SupportAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const {
    data: session,
    refetch,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["assistant", "session"],
    queryFn: fetchAssistantSession,
    enabled: false,
  });

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  useEffect(() => {
    if (!session) return;
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [session]);

  const sendMutation = useMutation({
    mutationFn: sendAssistantMessage,
    onSuccess: (data) => {
      queryClient.setQueryData(["assistant", "session"], data);
      setMessage("");
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "خطا در ارسال پیام",
        description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
      });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: submitAssistantFeedback,
    onSuccess: (data) => {
      queryClient.setQueryData(["assistant", "session"], data);
      toast({
        title: "ممنون از بازخورد شما",
        description: "نظر شما ثبت شد و به تیم پشتیبانی ارسال گردید.",
      });
      setRating(null);
      setComment("");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت نظر",
        description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
      });
    },
  });

  const canSend = message.trim().length > 0 && !sendMutation.isPending;

  const hasAssistantReply = useMemo(() => {
    if (!session) return false;
    return session.messages.some((msg) => msg.role === "ASSISTANT");
  }, [session]);

  const showFeedbackForm = Boolean(session && hasAssistantReply && !session.hasFeedback);

  useEffect(() => {
    if (session?.hasFeedback) {
      setRating(null);
      setComment("");
    }
  }, [session?.hasFeedback]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }
    sendMutation.mutate(message.trim());
  };

  const handleFeedbackSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedbackMutation.mutate({
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className="fixed bottom-6 left-4 z-40 flex flex-col items-start gap-3 sm:left-6">
      {isOpen && (
        <div className="w-[320px] max-w-[90vw] rounded-3xl border border-border bg-background/95 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4 rounded-t-3xl bg-gradient-to-l from-primary/10 to-primary/5 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">دستیار روانیک</p>
              <p className="text-xs text-muted-foreground">گفت‌وگوی فوری دربارهٔ سایت</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="px-4 pb-4 pt-3">
            <div className="mb-3 text-xs text-muted-foreground">
              {isLoading || isFetching
                ? "در حال آماده‌سازی گفتگو..."
                : "پرسش خود را بنویسید تا پاسخ هوشمند دریافت کنید."}
            </div>
            <ScrollArea className="h-64 rounded-2xl border border-dashed border-muted p-3">
              <div className="space-y-3">
                {session?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                        msg.role === "USER"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className="mt-1 block text-[10px] opacity-70">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      در حال دریافت پاسخ...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="mt-3 space-y-2">
              <Input
                placeholder="سؤال خود را بنویسید..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={sendMutation.isPending}
              />
              <Button type="submit" className="w-full" disabled={!canSend}>
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ارسال...
                  </>
                ) : (
                  <>
                    <Send className="ml-2 h-4 w-4" />
                    ارسال پیام
                  </>
                )}
              </Button>
            </form>
            {showFeedbackForm && (
              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                <h3 className="text-sm font-semibold text-foreground">نظر شما دربارهٔ این گفتگو چیست؟</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  امتیاز دهید و اگر نکته‌ای دارید برای ما بنویسید.
                </p>
                <form onSubmit={handleFeedbackSubmit} className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${
                          rating === value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <Star
                          className={`h-4 w-4 ${rating && rating >= value ? "fill-current" : ""}`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="دیدگاه یا پیشنهاد شما"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                  />
                  <Button type="submit" className="w-full" disabled={feedbackMutation.isPending}>
                    {feedbackMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        در حال ثبت نظر
                      </>
                    ) : (
                      "ارسال بازخورد"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      <Button
        size="lg"
        className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}
