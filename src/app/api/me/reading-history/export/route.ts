import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getReadingHistoryEntries, ReadingHistoryFilters } from "@/lib/reading-history";

const RANGE_OPTIONS = new Set(["7d", "30d", "90d", "365d", "all"]);

const createCsv = (rows: { title: string; author: string; viewedAt: string }[]) => {
  const header = "title,author,viewedAt";
  const body = rows
    .map(({ title, author, viewedAt }) =>
      [title, author, viewedAt]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return `${header}\n${body}`;
};

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
    const filters: ReadingHistoryFilters = { limit: 200 };

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

    const history = await getReadingHistoryEntries(userId, filters);

    const rows = history.map((entry) => ({
      title: entry.article.title,
      author: entry.article.author?.name || "ناشناس",
      viewedAt: new Date(entry.viewedAt).toISOString(),
    }));

    const csv = createCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=reading-history-${Date.now()}.csv`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EXPORT_READING_HISTORY_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
