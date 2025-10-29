// src/app/api/social/campaigns/route.ts
import { NextResponse } from 'next/server';

import { SOCIAL_CAMPAIGNS } from '@/lib/social-campaigns';

export async function GET() {
  return NextResponse.json(SOCIAL_CAMPAIGNS);
}
