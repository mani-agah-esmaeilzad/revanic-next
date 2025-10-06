// src/hooks/usePushNotifications.ts
"use client";

import { useCallback, useEffect, useState } from 'react';

import { applyJourneyHeader } from '@/hooks/useEventTracker';

const STORAGE_KEY = 'revanic_push_enabled';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window);
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  const registerSubscription = useCallback(async (subscription: PushSubscription) => {
    const body = JSON.stringify(subscription);
    const response = await fetch(
      '/api/push/subscribe',
      applyJourneyHeader({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
    );
    if (!response.ok) {
      throw new Error('FAILED_TO_REGISTER_PUSH_SUBSCRIPTION');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) throw new Error('PUSH_NOT_SUPPORTED');

    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);
    if (permissionResult !== 'granted') {
      window.localStorage.removeItem(STORAGE_KEY);
      throw new Error('PERMISSION_DENIED');
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await registerSubscription(existingSubscription);
      window.localStorage.setItem(STORAGE_KEY, '1');
      setIsRegistered(true);
      return existingSubscription;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error('VAPID_PUBLIC_KEY_MISSING');
    }

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    await registerSubscription(newSubscription);
    window.localStorage.setItem(STORAGE_KEY, '1');
    setIsRegistered(true);
    return newSubscription;
  }, [isSupported, registerSubscription]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await fetch(
      '/api/push/subscribe',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }
    );

    await subscription.unsubscribe();
    window.localStorage.removeItem(STORAGE_KEY);
    setIsRegistered(false);
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isRegistered,
    requestPermission,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
