import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Entry } from "@/models/Entry";
import { LUNCH_PRICE, countHolidayDaysForMonth, isTimeOffStatus, monthBounds, normalizeDayStatus, parseMonthKey } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const month = parseMonthKey(request.nextUrl.searchParams.get("month"));
    const { start, end } = monthBounds(month);

    await connectToDatabase();
    const entries = await Entry.find({
      userId,
      date: { $gte: start, $lte: end }
    }).lean();

    const workEntries = entries.filter((entry) => !isTimeOffStatus(entry.dayStatus));
    const totalDelayMinutes = workEntries.reduce((total, entry) => total + (entry.delayMinutes ?? 0), 0);
    const lunchDays = workEntries.filter((entry) => entry.hadLunch).length;
    const holidayDays = countHolidayDaysForMonth(month, entries);
    const sickDays = entries.filter((entry) => normalizeDayStatus(entry.dayStatus) === "sick").length;
    const leaveDays = entries.filter((entry) => normalizeDayStatus(entry.dayStatus) === "leave").length;
    const lunchSpend = lunchDays * LUNCH_PRICE;

    return NextResponse.json({
      month,
      totalDelayMinutes,
      lunchDays,
      lunchSpend,
      holidayDays,
      sickDays,
      leaveDays
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load summary", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
