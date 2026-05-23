import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { originalText, instruction } = await req.json();

    if (!originalText || !instruction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const customApiKey = cookieStore.get("google_gemini_api_key")?.value;

    const google = createGoogleGenerativeAI({
      apiKey: customApiKey || process.env.GOOGLE_GEMINI_API_KEY || "",
    });

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: `You are an expert presentation designer rewriting a single slide's outline based on user instructions.
You must return ONLY the rewritten text in the exact same format (usually a heading with a few bullet points in markdown).
Do not add any conversational text or explanations.`,
      prompt: `ORIGINAL TEXT:\n${originalText}\n\nUSER INSTRUCTION:\n${instruction}`,
    });

    return NextResponse.json({ rewrittenText: text });
  } catch (error) {
    console.error("Rewrite Error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite outline card" },
      { status: 500 },
    );
  }
}
