import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any;
    const { id } = await params;
    const ev = await anyDb.calendarEvent?.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (ev.userId && userId && ev.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await anyDb.calendarEvent?.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to delete event" },
      { status: 500 },
    );
  }
}
