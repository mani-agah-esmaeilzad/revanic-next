// src/components/SeriesFollowButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface SeriesFollowButtonProps {
  slug: string;
  initialFollowing: boolean;
}

const SeriesFollowButton = ({ slug, initialFollowing }: SeriesFollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const toggleFollow = () => {
    startTransition(async () => {
      try {
        const method = isFollowing ? "DELETE" : "POST";
        const response = await fetch(`/api/series/${slug}/follow`, {
          method,
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message || "خطا در به‌روزرسانی وضعیت دنبال‌کردن.");
        }

        const nextState = !isFollowing;
        setIsFollowing(nextState);
        router.refresh();
        toast({
          description: nextState
            ? "این سری به لیست دنبال‌شده‌های شما اضافه شد."
            : "دنبال‌کردن سری لغو شد.",
        });
      } catch (error) {
        console.error("SERIES_FOLLOW_TOGGLE_ERROR", error);
        toast({
          variant: "destructive",
          description:
            error instanceof Error ? error.message : "به‌روزرسانی دنبال‌کردن با مشکل مواجه شد.",
        });
      }
    });
  };

  return (
    <Button onClick={toggleFollow} disabled={isPending} variant={isFollowing ? "secondary" : "default"}>
      {isPending ? "در حال ثبت..." : isFollowing ? "دنبال شده" : "دنبال کردن سری"}
    </Button>
  );
};

export default SeriesFollowButton;
