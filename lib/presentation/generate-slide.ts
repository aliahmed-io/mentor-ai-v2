import { generateObject, type LanguageModel } from "ai";
import {
  getSchemaForTemplate,
  GeneratedSlideContent,
} from "./layout-templates";
import { validateAndSanitizeSlot } from "./slot-validator";

const MAX_RETRIES = 2;

export interface GenerateSingleSlideInput {
  model: LanguageModel;
  title: string;
  outlineItem: string;
  slideIndex: number;
  totalSlides: number;
  language: string;
  tone: string;
  templateId: string;
  creativeBrief: string;
}

export async function generateSingleSlide(
  input: GenerateSingleSlideInput
): Promise<GeneratedSlideContent> {
  const {
    model,
    title,
    outlineItem,
    slideIndex,
    totalSlides,
    language,
    tone,
    templateId,
    creativeBrief,
  } = input;

  console.log(
    `[generateSingleSlide] Starting parallel generation for slide ${slideIndex + 1}/${totalSlides} [Template: ${templateId}]`
  );

  const schema = getSchemaForTemplate(templateId);

  const systemPrompt = `
You are an expert presentation copywriter and designer.
Your task is to write the exact content for a specific slide based on the provided template and creative brief.

## PRESENTATION CONTEXT
- Title: ${title}
- Language: ${language}
- Tone: ${tone}

## SLIDE ASSIGNMENT
- Outline Topic: ${outlineItem}
- Template Assigned: ${templateId}
- Creative Brief: ${creativeBrief}

## INSTRUCTIONS
- Write highly compelling, concise copy.
- DO NOT EXCEED word budgets. Think in short, punchy statements.
- Never write placeholder text.
- Fill out all required slots perfectly as defined by the JSON Schema.
`;

  let retries = 0;
  let lastReason = "";

  while (retries <= MAX_RETRIES) {
    try {
      const { object } = await generateObject({
        model,
        schema,
        system: systemPrompt,
        prompt: "Generate the slide content now.",
        temperature: retries > 0 ? 0.4 : 0.7,
      });

      // Convert slots object back to array for compatibility with the rest of the pipeline
      const slotsArray = Array.isArray(object.slots) 
        ? object.slots 
        : Object.values(object.slots);

      // Strict truncation safety net (The Guillotine)
      const sanitizedSlots = slotsArray.map((slot: any) =>
        validateAndSanitizeSlot(slot, templateId)
      );

      return {
        templateId,
        slots: sanitizedSlots,
      };
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[generateSingleSlide] Attempt ${retries + 1} failed for slide ${slideIndex + 1}: ${lastReason}`
      );
      retries++;
    }
  }

  throw new Error(
    `[generateSingleSlide] Failed to generate valid slide after ${MAX_RETRIES + 1} attempts. Detail: ${lastReason}`
  );
}
