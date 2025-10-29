// src/app/api/series/route.ts
import { NextResponse } from "next/server";

import { getUserIdFromSessionCookie } from "@/lib/auth-session";
import { getPublishedSeriesList } from "@/lib/series";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getUserIdFromSessionCookie();
    const series = await getPublishedSeriesList(userId);
    return NextResponse.json(series);
  } catch (error) {
    console.error("SERIES_LIST_ERROR", error);
    return NextResponse.json({ message: "خطای داخلی سرور" }, { status: 500 });
  }
}
