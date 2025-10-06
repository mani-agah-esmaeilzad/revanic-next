// src/components/SeriesAlertsToggle.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

interface SeriesAlertsToggleProps {
  slug: string;
  isFollowing: boolean;
  initialEmail: boolean;
}

export const SeriesAlertsToggle = ({ slug, isFollowing, initialEmail }: SeriesAlertsToggleProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [emailEnabled, setEmailEnabled] = useState(initialEmail);

  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      const response = await fetch(`/api/series/${slug}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyByEmail: value }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'به‌روزرسانی اعلان‌های سری با خطا مواجه شد.');
      }
      return response.json() as Promise<{ notifyByEmail: boolean }>;
    },
    onSuccess: (data) => {
      setEmailEnabled(data.notifyByEmail);
      router.refresh();
      toast({ description: data.notifyByEmail ? 'اعلان ایمیلی سری فعال شد.' : 'اعلان ایمیلی سری غیرفعال شد.' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'تغییر اعلان ممکن نشد.',
      });
    },
  });

  const handleChange = (value: boolean) => {
    if (!isFollowing) {
      toast({
        variant: 'destructive',
        description: 'برای دریافت ایمیل باید ابتدا سری را دنبال کنید.',
      });
      return;
    }
    setEmailEnabled(value);
    mutation.mutate(value);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
      <div className="space-y-1">
        <span className="font-medium text-foreground">اعلان ایمیلی قسمت‌های جدید</span>
        <p className="text-xs text-muted-foreground">هر زمان قسمت تازه‌ای منتشر شود، یک ایمیل دریافت می‌کنید.</p>
      </div>
      <Switch
        checked={emailEnabled}
        disabled={mutation.isPending || !isFollowing}
        onCheckedChange={handleChange}
        aria-label="فعال‌سازی اعلان ایمیلی سری"
      />
    </div>
  );
};
