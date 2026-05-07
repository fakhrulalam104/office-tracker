import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { Entry } from "@/models/Entry";
import {
  clamp,
  isTimeOffStatus,
  monthBounds,
  normalizeComment,
  normalizeDailyExpenses,
  normalizeDayStatus,
  parseDateKey,
  parseMonthKey,
  totalDailyExpenses
} from "@/lib/utils";

export const runtime = "nodejs";

function toEntryResponse(entry: any) {
  const dayStatus = normalizeDayStatus(entry.dayStatus);
  return {
    id: entry._id.toString(),
    date: entry.date,
    delayMinutes: entry.delayMinutes,
    hadLunch: entry.hadLunch,
    dayStatus,
    comment: normalizeComment(entry.comment),
    dailyExpenses: normalizeDailyExpenses(entry.dailyExpenses, entry.dailyExpenseAmount, entry.dailyExpenseNote),
    createdAt: entry.createdAt?.toISOString(),
    updatedAt: entry.updatedAt?.toISOString()
  };
}

type SessionShape = {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    organizationId?: string | null;
  } | null;
} | null;

function getUserId(session: SessionShape) {
  return session?.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const month = parseMonthKey(request.nextUrl.searchParams.get("month"));
    const { start, end } = monthBounds(month);

    await connectToDatabase();

    const entries = await Entry.find({
      userId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .lean();

    return NextResponse.json({ entries: entries.map((entry) => toEntryResponse(entry)) });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load entries", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const date = parseDateKey(body?.date);
    const dayStatus = normalizeDayStatus(body?.dayStatus);
    const delayMinutes = isTimeOffStatus(dayStatus) ? 0 : clamp(Number(body?.delayMinutes ?? 0), 0, 480);
    const hadLunch = isTimeOffStatus(dayStatus) ? false : Boolean(body?.hadLunch);
    const comment = isTimeOffStatus(dayStatus) ? normalizeComment(body?.comment) : "";
    const dailyExpenses = normalizeDailyExpenses(body?.dailyExpenses, body?.dailyExpenseAmount, body?.dailyExpenseNote);
    const dailyExpenseAmount = totalDailyExpenses(dailyExpenses);
    const dailyExpenseNote = dailyExpenses[0]?.note ?? "";

    if (!date) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }

    await connectToDatabase();

    const existingEntry = await Entry.findOne({ userId, date });
    if (existingEntry) {
      existingEntry.delayMinutes = delayMinutes;
      existingEntry.hadLunch = hadLunch;
      existingEntry.dayStatus = dayStatus;
      existingEntry.comment = comment;
      existingEntry.dailyExpenseAmount = dailyExpenseAmount;
      existingEntry.dailyExpenseNote = dailyExpenseNote;
      existingEntry.dailyExpenses = dailyExpenses;
      await existingEntry.save();
      await logAuditEvent({
        userId,
        organizationId: session?.user?.organizationId,
        action: "entry.updated",
        entityType: "entry",
        entityId: existingEntry._id.toString(),
        details: { date, dayStatus, delayMinutes, hadLunch, dailyExpenseAmount }
      });

      return NextResponse.json({ entry: toEntryResponse(existingEntry), created: false });
    }

    const entry = await Entry.create({
      userId,
      date,
      delayMinutes,
      hadLunch,
      dayStatus,
      comment,
      dailyExpenseAmount,
      dailyExpenseNote,
      dailyExpenses
    });
    await logAuditEvent({
      userId,
      organizationId: session?.user?.organizationId,
      action: "entry.created",
      entityType: "entry",
      entityId: entry._id.toString(),
      details: { date, dayStatus, delayMinutes, hadLunch, dailyExpenseAmount }
    });

    return NextResponse.json({ entry: toEntryResponse(entry), created: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to save entry", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
