// src/components/PushNotificationManager.tsx
"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationManager = () => {
  const { isSupported, permission, isRegistered, requestPermission, unsubscribe } = usePushNotifications();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [permission, isRegistered]);

  if (!isSupported) return null;

  const handleToggle = async () => {
    try {
      if (isRegistered) {
        await unsubscribe();
      } else {
        await requestPermission();
      }
    } catch (err) {
      console.error('PUSH_TOGGLE_ERROR', err);
      setError(err instanceof Error ? err.message : 'خطایی هنگام فعال‌سازی اعلان رخ داد.');
    }
  };

  const label = isRegistered ? 'غیرفعال‌سازی اعلان‌ها' : 'فعال‌سازی اعلان‌ها';
  const icon = isRegistered ? <BellOff className="ml-2 h-4 w-4" /> : <Bell className="ml-2 h-4 w-4" />;

  return (
    <div className="fixed left-4 bottom-24 z-40 hidden flex-col gap-2 text-sm text-muted-foreground md:flex">
      <Button variant={isRegistered ? 'secondary' : 'default'} onClick={handleToggle} size="sm">
        {icon}
        {label}
      </Button>
      {permission === 'denied' ? (
        <p className="max-w-[240px] text-xs text-red-500">
          برای دریافت اعلان اجازه مرورگر را از تنظیمات فعال کنید.
        </p>
      ) : null}
      {error ? <p className="max-w-[240px] text-xs text-red-500">{error}</p> : null}
    </div>
  );
};
