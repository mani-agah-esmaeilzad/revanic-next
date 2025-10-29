// src/hooks/useEventTracker.ts
"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

import type { TrackingEventName } from '@/lib/analytics';
import { JOURNEY_HEADER, JOURNEY_STORAGE_KEY } from '@/lib/analytics-constants';

function getOrCreateJourneyId() {
  if (typeof window === 'undefined') return undefined;
  const stored = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
  if (stored) return stored;
  const uuid = crypto.randomUUID();
  window.localStorage.setItem(JOURNEY_STORAGE_KEY, uuid);
  return uuid;
}

export function useJourneyId() {
  const [journeyId, setJourneyId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return window.localStorage.getItem(JOURNEY_STORAGE_KEY) ?? undefined;
  });

  useEffect(() => {
    if (journeyId) return;
    const id = getOrCreateJourneyId();
    setJourneyId(id);
  }, [journeyId]);

  return journeyId;
}

export type TrackEventInput = {
  name: TrackingEventName | (string & {});
  payload?: Record<string, unknown>;
  experimentId?: string;
  variant?: string;
};

export function useEventTracker() {
  const journeyIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    journeyIdRef.current = getOrCreateJourneyId();
  }, []);

  return useCallback(async ({ name, payload, experimentId, variant }: TrackEventInput) => {
    if (typeof window === 'undefined') return;
    const journeyId = journeyIdRef.current ?? getOrCreateJourneyId();
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          payload,
          experimentId,
          variant,
          journeyId,
        }),
        keepalive: true,
      });
    } catch (error) {
      console.error('EVENT_TRACKING_FAILED', error);
    }
  }, []);
}

export function applyJourneyHeader(init?: RequestInit) {
  const journeyId = (typeof window !== 'undefined' && window.localStorage.getItem(JOURNEY_STORAGE_KEY)) || undefined;
  const headers = new Headers(init?.headers || {});
  if (journeyId) {
    headers.set(JOURNEY_HEADER, journeyId);
  }
  return {
    ...init,
    headers,
  } satisfies RequestInit;
}

export function getJourneyIdFromHeaders(headers: Headers) {
  return headers.get(JOURNEY_HEADER) ?? undefined;
}
