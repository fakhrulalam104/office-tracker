import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";

export const runtime = "nodejs";

function normalizeTitle(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 160) : "Untitled note";
}

function normalizeBody(value: unknown) {
  return typeof value === "string" ? value.slice(0, 100000) : "";
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/\s+/g, " ").slice(0, 40))
        .filter(Boolean)
    )
  ).slice(0, 12);
}

function toNoteResponse(note: any) {
  return {
    id: String(note._id),
    title: note.title ?? "Untitled note",
    body: note.body ?? "",
    tags: Array.isArray(note.tags) ? note.tags : [],
    pinned: Boolean(note.pinned),
    archived: Boolean(note.archived),
    createdAt: note.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: note.updatedAt?.toISOString?.() ?? new Date().toISOString()
  };
}

export async function GET() {
  try {
    const currentUser = await requireAppUser();
    await connectToDatabase();

    const notes = await Note.find({ userId: currentUser.id }).sort({ pinned: -1, updatedAt: -1 }).limit(500).lean();

    return NextResponse.json({ notes: notes.map((note) => toNoteResponse(note)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAppUser();
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const note = await Note.create({
      userId: currentUser.id,
      organizationId: currentUser.organizationId ?? undefined,
      title: normalizeTitle(body?.title),
      body: normalizeBody(body?.body),
      tags: normalizeTags(body?.tags),
      pinned: Boolean(body?.pinned),
      archived: Boolean(body?.archived)
    });

    return NextResponse.json({ note: toNoteResponse(note) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
