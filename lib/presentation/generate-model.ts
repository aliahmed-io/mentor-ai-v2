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
      return openai("gpt-5.5");
    }
    if (geminiKey) {
      const google = createGoogleGenerativeAI({ apiKey: geminiKey });
      return google("gemini-3.1-flash-lite-preview");
    }
  }

  if (textModel === "openai" && openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai("gpt-5.5");
  }
  if ((textModel === "gemini" || textModel === "quality") && geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google("gemini-3.1-flash-lite-preview");
  }
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google("gemini-3.1-flash-lite-preview");
  }
  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai("gpt-5.5");
  }
  return null;
}
