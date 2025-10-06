// src/app/api/internal/series/process/route.ts
import { NextResponse } from 'next/server';

import { processSeriesReleaseQueue } from '@/lib/series-scheduler';

function resolveToken(request: Request) {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

export async function POST(request: Request) {
  const requiredToken = process.env.CRON_SECRET;
  if (requiredToken) {
    const provided = resolveToken(request);
    if (provided !== requiredToken) {
      return NextResponse.json({ message: 'دسترسی غیرمجاز' }, { status: 401 });
    }
  }

  try {
    const result = await processSeriesReleaseQueue();
    return NextResponse.json(result);
  } catch (error) {
    console.error('SERIES_RELEASE_PROCESS_ERROR', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}
