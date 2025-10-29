// src/app/api/series/[slug]/route.ts
import { NextResponse } from "next/server";

import { getUserIdFromSessionCookie } from "@/lib/auth-session";
import { getSeriesDetail } from "@/lib/series";

interface RouteContext {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserIdFromSessionCookie();
    const series = await getSeriesDetail(context.params.slug, userId);

    if (!series) {
      return NextResponse.json({ message: "سری مورد نظر یافت نشد." }, { status: 404 });
    }

    return NextResponse.json(series);
  } catch (error) {
    console.error("SERIES_DETAIL_ERROR", error);
    return NextResponse.json({ message: "خطای داخلی سرور" }, { status: 500 });
  }
}
