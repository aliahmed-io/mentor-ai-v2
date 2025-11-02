import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

type ChatBody = {
  sessionId: string;
  message: string;
};

const SYSTEM_PROMPT = `You are a helpful study assistant.
Always respond in clean Markdown (headings, lists, tables when helpful).
Do not output JSON or code blocks unless explicitly asked.
Keep responses concise and readable.`;

export async function POST(req: Request) {
  try {
    const { sessionId, message } = (await req.json()) as ChatBody;
    if (!sessionId || !message || !message.trim()) {
      return NextResponse.json(
        { error: "Missing sessionId or message" },
        { status: 400 },
      );
    }

    const session = await auth();

    // Ensure session exists
    const chatSession = await db.chatSession.upsert({
      where: { id: sessionId },
      update: { lastActiveAt: new Date() },
      create: {
        id: sessionId,
        userId: session?.user?.id ?? null,
      },
    });

    // Persist user message
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message.trim(),
      },
    });

    // Gather short context: fileText excerpt + last few messages
    const fileText = chatSession.fileText ?? "";
    const fileExcerpt = fileText ? fileText.slice(0, 2000) : "";

    const recentMessages = await db.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { role: true, content: true },
    });

    const openai = createOpenAI();
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages: [
        fileExcerpt
          ? {
              role: "system" as const,
              content:
                "The following is context extracted from the user's uploaded document. Use it only if relevant.\n\n" +
                fileExcerpt,
            }
          : undefined,
        ...recentMessages.map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as
            | "user"
            | "assistant",
          content: m.content,
        })),
      ].filter(Boolean) as Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }>,
      maxOutputTokens: 1024,
    });

    const reply = text || "(no content)";

    // Persist assistant message
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: reply,
      },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("/api/chat error", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}