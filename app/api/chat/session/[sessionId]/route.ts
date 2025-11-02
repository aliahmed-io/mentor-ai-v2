import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Update last active timestamp (best-effort)
    await db.chatSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});

    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("/api/chat/session error", error);
    return NextResponse.json(
      { error: "Failed to load session messages" },
      { status: 500 },
    );
  }
}


