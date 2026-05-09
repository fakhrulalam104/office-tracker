import { NextResponse } from "next/server";
import { Types } from "mongoose";
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireAppUser();

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: "Invalid note id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const note = await Note.findOne({ _id: params.id, userId: currentUser.id });
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    if ("title" in body) {
      note.title = normalizeTitle(body.title);
    }
    if ("body" in body) {
      note.body = normalizeBody(body.body);
    }
    if ("tags" in body) {
      note.tags = normalizeTags(body.tags);
    }
    if ("pinned" in body) {
      note.pinned = Boolean(body.pinned);
    }
    if ("archived" in body) {
      note.archived = Boolean(body.archived);
    }

    await note.save();

    return NextResponse.json({ note: toNoteResponse(note) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireAppUser();

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: "Invalid note id" }, { status: 400 });
    }

    await connectToDatabase();
    const note = await Note.findOne({ _id: params.id, userId: currentUser.id });

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    await note.deleteOne();

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
