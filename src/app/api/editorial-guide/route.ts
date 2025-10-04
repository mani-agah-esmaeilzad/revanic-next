import { NextResponse } from "next/server";
import {
  EDITORIAL_SECTIONS,
  EDITORIAL_TIPS,
  EDITORIAL_VALUES,
  ensureEditorialCalendarEntries,
  getEditorialCalendarEntries,
} from "@/lib/editorial-guide";

export async function GET(request: Request) {
  await ensureEditorialCalendarEntries();

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const calendar = await getEditorialCalendarEntries(limit);

  return NextResponse.json({
    sections: EDITORIAL_SECTIONS,
    values: EDITORIAL_VALUES,
    tips: EDITORIAL_TIPS,
    calendar,
  });
}
