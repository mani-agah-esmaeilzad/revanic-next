// src/app/api/me/series/route.ts
import { NextResponse } from "next/server";

import { getUserIdFromSessionCookie } from "@/lib/auth-session";
import { getFollowedSeriesList } from "@/lib/series";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getUserIdFromSessionCookie();
    if (!userId) {
      return NextResponse.json({ message: "برای مشاهده سری‌های دنبال‌شده وارد شوید." }, { status: 401 });
    }

    const series = await getFollowedSeriesList(userId);
    return NextResponse.json(series);
  } catch (error) {
    console.error("FOLLOWED_SERIES_LIST_ERROR", error);
    return NextResponse.json({ message: "خطای داخلی سرور" }, { status: 500 });
  }
}
