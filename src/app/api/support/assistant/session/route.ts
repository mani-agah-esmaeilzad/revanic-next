// src/app/api/support/assistant/session/route.ts
import { NextResponse } from "next/server";

import { loadOrCreateAssistantSession, mapSessionToDto } from "@/lib/assistant-server";

export async function GET() {
  const session = await loadOrCreateAssistantSession();
  return NextResponse.json(mapSessionToDto(session));
}
