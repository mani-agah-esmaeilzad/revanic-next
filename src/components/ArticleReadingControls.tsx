// src/components/ArticleReadingControls.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BookOpenCheck, MoonStar, SunMedium } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface ArticleReadingControlsProps {
  articleId: number;
  articleTitle: string;
  contentId: string;
  initialProgress: number; // 0 to 1
}

const progressToPercent = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 100);

export const ArticleReadingControls = ({
  articleId,
  articleTitle,
  contentId,
  initialProgress,
}: ArticleReadingControlsProps) => {
  const { toast } = useToast();
  const [readingMode, setReadingMode] = useState(false);
  const [progress, setProgress] = useState(progressToPercent(initialProgress));
  const lastReportedRef = useRef(progressToPercent(initialProgress));
  const frameRef = useRef<number>();

  const mutation = useMutation({
    mutationFn: async (payload: { progress: number; completed?: boolean }) => {
      const response = await fetch(`/api/articles/${articleId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'خطا در ذخیره پیشرفت مطالعه.');
      }
      return response.json() as Promise<{ progressPercent: number }>;
    },
    onSuccess: (data) => {
      const next = Math.min(100, Math.max(0, Math.round(data.progressPercent)));
      lastReportedRef.current = next;
      setProgress(next);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        description: error?.message || 'ذخیره پیشرفت با خطا مواجه شد.',
      });
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem('revanic_reading_mode');
    if (stored === '1') {
      setReadingMode(true);
      document.body.classList.add('reading-mode');
    }
    return () => {
      document.body.classList.remove('reading-mode');
    };
  }, []);

  const handleToggleReadingMode = (value: boolean) => {
    setReadingMode(value);
    if (value) {
      document.body.classList.add('reading-mode');
      localStorage.setItem('revanic_reading_mode', '1');
    } else {
      document.body.classList.remove('reading-mode');
      localStorage.removeItem('revanic_reading_mode');
    }
  };

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;

    const syncProgress = () => {
      const rect = container.getBoundingClientRect();
      const viewport = window.innerHeight;
      const totalScrollable = rect.height - viewport;
      let current = 0;
      if (totalScrollable <= 0) {
        current = 100;
      } else {
        const distance = Math.min(Math.max(-rect.top, 0), totalScrollable);
        current = Math.round((distance / totalScrollable) * 100);
      }

      current = Math.max(current, lastReportedRef.current);
      if (current > 100) current = 100;

      setProgress(current);

      const thresholdReached = current >= 95;
      const delta = current - lastReportedRef.current;
      if ((delta >= 5 || (thresholdReached && current > lastReportedRef.current)) && !mutation.isPending) {
        const payload = thresholdReached
          ? { progress: current, completed: true as const }
          : { progress: current };
        mutation.mutate(payload);
      }
    };

    const handleScroll = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(syncProgress);
    };

    syncProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [contentId, mutation]);

  const handleMarkComplete = () => {
    setProgress(100);
    lastReportedRef.current = 100;
    mutation.mutate({ progress: 100, completed: true });
    toast({ description: 'این مقاله به عنوان مطالعه‌شده ثبت شد.' });
  };

  const progressLabel = useMemo(() => `${progress}% مطالعه شده`, [progress]);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-border/40 bg-background/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:max-w-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-journal">{progressLabel}</span>
          <span className="text-xs text-muted-foreground">{articleTitle}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 px-3 py-2">
          <SunMedium className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={readingMode}
            onCheckedChange={handleToggleReadingMode}
            aria-label="فعال‌سازی حالت مطالعه"
          />
          <MoonStar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">حالت مطالعه</span>
        </div>
        <Button
          variant="secondary"
          className="whitespace-nowrap"
          onClick={handleMarkComplete}
          disabled={mutation.isPending}
        >
          <BookOpenCheck className="ml-2 h-4 w-4" />
          علامت به‌عنوان خوانده‌شده
        </Button>
      </div>
    </div>
  );
};
