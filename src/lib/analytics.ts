// src/lib/analytics.ts
import { Prisma } from '@prisma/client';

import { JOURNEY_HEADER } from '@/lib/analytics-constants';
import { prisma } from '@/lib/prisma';

export type TrackingEventName =
  | 'page_view'
  | 'registration_started'
  | 'registration_completed'
  | 'registration_failed'
  | 'subscription_started'
  | 'subscription_completed'
  | 'experiment_exposure';

interface BaseEventPayload {
  journeyId?: string | null;
  experimentId?: string | null;
  variant?: string | null;
  payload?: Record<string, unknown> | null;
}

interface ServerEventPayload extends BaseEventPayload {
  name: TrackingEventName | (string & {});
  userId?: number | null;
}

export async function logServerEvent({
  name,
  journeyId,
  userId,
  payload,
  experimentId,
  variant,
}: ServerEventPayload) {
  try {
    await prisma.trackingEvent.create({
      data: {
        name,
        journeyId: journeyId ?? null,
        userId: userId ?? null,
        payload: payload ? (payload as Prisma.InputJsonValue) : undefined,
        experimentId: experimentId ?? null,
        variant: variant ?? null,
      },
    });
  } catch (error) {
    console.error('TRACKING_EVENT_ERROR', { name, journeyId, error });
  }
}

export function getJourneyIdFromRequest(request: Request) {
  return request.headers.get(JOURNEY_HEADER) ?? undefined;
}

export function getJourneyIdFromHeaders(headers: Headers) {
  return headers.get(JOURNEY_HEADER) ?? undefined;
}
