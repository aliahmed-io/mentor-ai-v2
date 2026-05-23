import fs from "node:fs";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { extractTextFromFile } from "../../../utils/extractText";

// Global sessions store (in production, use Redis or database)
const sessions =
  (globalThis as any).__SESSIONS_UPLOAD__ ||
  ((globalThis as any).__SESSIONS_UPLOAD__ = new Map());

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "no files" }, { status: 400 });
    }

    let combinedText = "";

    for (const file of files) {
      // Convert File to buffer for processing
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a temporary file path (Windows compatible)
      const tempPath = `${process.env.TEMP || process.env.TMP || "/tmp"}/${Date.now()}-${file.name}`;
      fs.writeFileSync(tempPath, buffer);

      try {
        const text = await extractTextFromFile(tempPath, file.type);
        if (text) {
          combinedText += `\n\n--- Document: ${file.name} ---\n\n${text}`;
        }
      } finally {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempPath);
        } catch (cleanupErr) {
          console.warn("Failed to cleanup temp file:", cleanupErr);
        }
      }
    }

    try {
      // Create a session id
      const sessionId = Math.random().toString(36).slice(2, 9);
      sessions.set(sessionId, { fileText: combinedText, history: [] });
      try {
        const session = await auth();
        await db.chatSession.create({
          data: {
            id: sessionId,
            userId: session?.user?.id ?? null,
            fileText: combinedText,
          },
        });
      } catch (e) {
        console.warn("Failed to persist chat session", e);
      }

      return NextResponse.json({
        sessionId,
        text: combinedText,
      });
    } catch (err: any) {
      console.error("Session creation error:", err);
      throw err;
    }
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      {
        error: "upload failed",
        details: err.message,
      },
      { status: 500 },
    );
  }
}
