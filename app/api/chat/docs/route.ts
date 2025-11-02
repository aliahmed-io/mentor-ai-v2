import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

type SaveDocBody = {
  sessionId?: string;
  title?: string;
  content?: string;
  wholeConversation?: boolean;
};

export async function POST(req: Request) {
  try {
    const { sessionId, title, content, wholeConversation } = (await req.json()) as SaveDocBody;
    const session = await auth();

    let finalTitle = title?.trim() || `Chat notes - ${new Date().toLocaleString()}`;
    let finalContent = content?.trim() ?? "";

    if (!finalContent) {
      if (!sessionId) {
        return NextResponse.json({ error: "Missing content or sessionId" }, { status: 400 });
      }

      // Build transcript when wholeConversation requested
      const chatSession = await db.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!chatSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const fileExcerpt = chatSession.fileText ? chatSession.fileText.slice(0, 800) : "";
      let transcript = "";
      if (wholeConversation) {
        const lines = chatSession.messages.map((m) =>
          (m.role === "user" ? "**User:** " : "**Assistant:** ") + (m.content || ""),
        );
        transcript = lines.join("\n\n");
      }

      finalContent = `# ${finalTitle}
${fileExcerpt ? `\n> Context excerpt:\n> ${fileExcerpt.replace(/\n/g, "\n> ")}\n` : ""}
\n## Conversation\n\n${transcript}`.trim();
    }

    const saved = await db.chatDocument.create({
      data: {
        sessionId: sessionId ?? null,
        userId: session?.user?.id ?? null,
        title: finalTitle,
        content: finalContent,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (error) {
    console.error("/api/chat/docs error", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit")) || 10));

    const docs = await db.chatDocument.findMany({
      where: session?.user?.id ? { userId: session.user.id } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, createdAt: true, thumbnailUrl: true },
    });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

