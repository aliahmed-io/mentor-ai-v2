import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type TextModelTier = "gemini" | "openai" | "quality";

export function resolvePresentationModel(
  textModel: TextModelTier,
  keys: { geminiKey?: string; openaiKey?: string },
): LanguageModel | null {
  const { geminiKey, openaiKey } = keys;

  if (textModel === "quality") {
    if (openaiKey) {
      const openai = createOpenAI({ apiKey: openaiKey });
      return openai("gpt-4o");
    }
    if (geminiKey) {
      const google = createGoogleGenerativeAI({ apiKey: geminiKey });
      return google("gemini-2.5-pro");
    }
  }

  if (textModel === "openai" && openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai("gpt-4o-mini");
  }
  if ((textModel === "gemini" || textModel === "quality") && geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google("gemini-2.5-flash");
  }
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google("gemini-2.5-flash");
  }
  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai("gpt-4o-mini");
  }
  return null;
}
