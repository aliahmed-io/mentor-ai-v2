import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await db.chatDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title } = await request.json();
    if (!title || typeof title !== "string")
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    const { id } = await params;
    const existing = await db.chatDocument.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db.chatDocument.update({ where: { id }, data: { title } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to rename" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const existing = await db.chatDocument.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db.chatDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to delete" },
      { status: 500 },
    );
  }
}
