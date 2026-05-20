import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { SlideParser } from "@/components/presentation/utils/parser";
import {
  getLayoutForSlide,
  getRequiredComponent,
  type RichComponent,
} from "./layout-recipes";
import {
  buildRepairSlidePrompt,
  buildSingleSlidePrompt,
  formatSearchResults,
  stripXmlFromResponse,
} from "./generate-prompts";
import { validateSlideContent, validateSlideXml } from "./slide-validator";

const MAX_RETRIES = 2;

export interface GenerateSingleSlideInput {
  model: LanguageModel;
  title: string;
  prompt: string;
  outlineItem: string;
  slideIndex: number;
  totalSlides: number;
  language: string;
  tone: string;
  searchResults?: Array<{ query: string; results: unknown[] }>;
  requiredComponent?: RichComponent;
  layout?: string;
}

export interface GenerateSingleSlideResult {
  xml: string;
  slideIndex: number;
  requiredComponent: RichComponent;
  layout: string;
  retries: number;
}

export async function generateSingleSlide(
  input: GenerateSingleSlideInput,
): Promise<GenerateSingleSlideResult> {
  const requiredComponent =
    input.requiredComponent ??
    getRequiredComponent(input.tone, input.slideIndex);
  const layout = input.layout ?? getLayoutForSlide(input.slideIndex);
  let searchResultsText = formatSearchResults(input.searchResults);
  if (
    (requiredComponent === "CHART" || requiredComponent === "TABLE") &&
    input.searchResults?.length
  ) {
    searchResultsText += `\n\nIMPORTANT: Use realistic numeric data from the research above in your <${requiredComponent}> — do not invent placeholder numbers.`;
  }

  let retries = 0;
  let lastReason = "Unknown validation failure";
  let xml = "";

  while (retries <= MAX_RETRIES) {
    const prompt =
      retries === 0
        ? buildSingleSlidePrompt({
            title: input.title,
            prompt: input.prompt,
            outlineItem: input.outlineItem,
            language: input.language,
            tone: input.tone,
            layout,
            requiredComponent,
            searchResultsText,
          })
        : buildRepairSlidePrompt({
            reason: lastReason,
            outlineItem: input.outlineItem,
            language: input.language,
            layout,
            requiredComponent,
          });

    const { text } = await generateText({
      model: input.model,
      prompt,
      temperature: retries > 0 ? 0.4 : 0.7,
    });

    xml = stripXmlFromResponse(text);
    if (!xml.includes("</SECTION>") && xml.includes("<SECTION")) {
      xml = `${xml}</SECTION>`;
    }
    if (!xml.startsWith("<PRESENTATION")) {
      xml = `<PRESENTATION>${xml}</PRESENTATION>`;
    }

    const xmlValidation = validateSlideXml(xml, requiredComponent);
    if (!xmlValidation.valid) {
      lastReason = xmlValidation.reason ?? "Invalid XML";
      retries++;
      continue;
    }

    const parser = new SlideParser();
    parser.parseChunk(xml);
    parser.finalize();
    const slides = parser.getAllSlides();
    const slide = slides[slides.length - 1] ?? slides[0];

    if (!slide) {
      lastReason = "Parser produced no slide";
      retries++;
      continue;
    }

    const contentValidation = validateSlideContent(slide, requiredComponent);
    if (!contentValidation.valid) {
      lastReason = contentValidation.reason ?? "Invalid slide content";
      retries++;
      continue;
    }

    const sectionMatch = xml.match(/<SECTION[\s\S]*?<\/SECTION>/i);
    return {
      xml: sectionMatch?.[0] ?? xml,
      slideIndex: input.slideIndex,
      requiredComponent,
      layout,
      retries,
    };
  }

  throw new Error(
    `Failed to generate valid slide after ${MAX_RETRIES + 1} attempts: ${lastReason}`,
  );
}
