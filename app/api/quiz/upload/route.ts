import { NextResponse } from "next/server";
import fs from "fs";
import { extractTextFromFile } from "@/utils/extractText";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = `${process.env.TEMP || process.env.TMP || "/tmp"}/${Date.now()}-${file.name}`;
    fs.writeFileSync(tempPath, buffer);

    try {
      const text = await extractTextFromFile(tempPath, file.type);
      return NextResponse.json({ text });
    } finally {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  } catch (error: any) {
    console.error("quiz upload error", error);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}


