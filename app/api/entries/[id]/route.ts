import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Entry } from "@/models/Entry";
import { clamp, isTimeOffStatus, normalizeComment, normalizeDayStatus, parseDateKey } from "@/lib/utils";
import { Types } from "mongoose";

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
    createdAt: entry.createdAt?.toISOString(),
    updatedAt: entry.updatedAt?.toISOString()
  };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: "Invalid entry id" }, { status: 400 });
    }

    const body = await request.json();
    const date = parseDateKey(body?.date);
    if (body?.date && !date) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }

    await connectToDatabase();
    const entry = await Entry.findById(params.id);

    if (!entry) {
      return NextResponse.json({ message: "Entry not found" }, { status: 404 });
    }

    const nextDayStatus = body?.dayStatus === undefined ? normalizeDayStatus(entry.dayStatus) : normalizeDayStatus(body?.dayStatus);
    const delayMinutes = isTimeOffStatus(nextDayStatus) ? 0 : clamp(Number(body?.delayMinutes ?? 0), 0, 480);
    const hadLunch = isTimeOffStatus(nextDayStatus) ? false : Boolean(body?.hadLunch);
    const comment = isTimeOffStatus(nextDayStatus) ? normalizeComment(body?.comment) : "";

    if (entry.userId.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (date && date !== entry.date) {
      const duplicate = await Entry.findOne({ userId, date });
      if (duplicate && duplicate._id.toString() !== entry._id.toString()) {
        return NextResponse.json({ message: "One entry per day already exists" }, { status: 409 });
      }
      entry.date = date;
    }

    entry.delayMinutes = delayMinutes;
    entry.hadLunch = hadLunch;
    entry.dayStatus = nextDayStatus;
    entry.comment = comment;
    await entry.save();

    return NextResponse.json({ entry: toEntryResponse(entry) });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update entry", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: "Invalid entry id" }, { status: 400 });
    }

    await connectToDatabase();
    const entry = await Entry.findById(params.id);

    if (!entry) {
      return NextResponse.json({ message: "Entry not found" }, { status: 404 });
    }

    if (entry.userId.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await entry.deleteOne();
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete entry", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
