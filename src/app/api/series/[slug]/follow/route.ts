// src/app/api/series/[slug]/follow/route.ts
import { NextResponse } from "next/server";

import { getUserIdFromSessionCookie } from "@/lib/auth-session";
import { followSeries, getSeriesDetail, unfollowSeries } from "@/lib/series";

interface RouteContext {
  params: { slug: string };
}

async function resolveSeriesId(slug: string) {
  const detail = await getSeriesDetail(slug);
  return detail?.id ?? null;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserIdFromSessionCookie();
    if (!userId) {
      return NextResponse.json({ message: "برای دنبال‌کردن سری باید وارد شوید." }, { status: 401 });
    }

    const seriesId = await resolveSeriesId(context.params.slug);
    if (!seriesId) {
      return NextResponse.json({ message: "سری مورد نظر یافت نشد." }, { status: 404 });
    }

    await followSeries(seriesId, userId);
    return NextResponse.json({ message: "سری به لیست دنبال‌شده‌ها اضافه شد." });
  } catch (error) {
    console.error("SERIES_FOLLOW_ERROR", error);
    return NextResponse.json({ message: "خطای داخلی سرور" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserIdFromSessionCookie();
    if (!userId) {
      return NextResponse.json({ message: "برای مدیریت دنبال‌کردن باید وارد شوید." }, { status: 401 });
    }

    const seriesId = await resolveSeriesId(context.params.slug);
    if (!seriesId) {
      return NextResponse.json({ message: "سری مورد نظر یافت نشد." }, { status: 404 });
    }

    await unfollowSeries(seriesId, userId);
    return NextResponse.json({ message: "دنبال‌کردن سری لغو شد." });
  } catch (error) {
    console.error("SERIES_UNFOLLOW_ERROR", error);
    return NextResponse.json({ message: "خطای داخلی سرور" }, { status: 500 });
  }
}
