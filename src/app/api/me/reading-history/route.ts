// src/app/api/me/reading-history/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getReadingHistoryEntries, ReadingHistoryFilters } from "@/lib/reading-history";

const RANGE_OPTIONS = new Set(["7d", "30d", "90d", "365d", "all"]);

export async function GET(req: Request) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const { searchParams } = new URL(req.url);
    const filters: ReadingHistoryFilters = {};

    const range = searchParams.get("range");
    if (range && RANGE_OPTIONS.has(range)) {
      filters.range = range as ReadingHistoryFilters["range"];
    }

    const search = searchParams.get("q");
    if (search) {
      filters.search = search;
    }

    const categoryIdParam = searchParams.get("categoryId");
    if (categoryIdParam) {
      const parsed = Number(categoryIdParam);
      if (!Number.isNaN(parsed)) {
        filters.categoryId = parsed;
      }
    }

    const limitParam = searchParams.get("limit");
    if (limitParam) {
      const parsed = Number(limitParam);
      if (!Number.isNaN(parsed)) {
        filters.limit = parsed;
      }
    }

    const history = await getReadingHistoryEntries(userId, filters);

    return NextResponse.json(history);
  } catch (error) {
    console.error("FETCH_READING_HISTORY_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}