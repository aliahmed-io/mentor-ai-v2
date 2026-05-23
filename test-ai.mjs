import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import dotenv from "dotenv";

dotenv.config({ path: "D:/mentor-ai v2/.env" });

async function run() {
  try {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });
    const model = google("gemini-3.5-flash");
    console.log("Trying gemini-3.5-flash...");
    const { text } = await generateText({
      model,
      prompt: "Hello world"
    });
    console.log("Success:", text);
  } catch(e) {
    console.error("AI Error:", e.message);
  }
}
run();
