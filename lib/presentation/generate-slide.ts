import type { LanguageModel } from "ai";
import { generateText } from "ai";
import { SlideParser } from "@/components/presentation/utils/parser";
import {
  buildRepairSlidePrompt,
  buildSingleSlidePrompt,
  formatSearchResults,
  stripXmlFromResponse,
} from "./generate-prompts";
import {
  getLayoutForSlide,
  getRequiredComponent,
  type RichComponent,
} from "./layout-recipes";
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

  console.log(
    `[generateSingleSlide] Starting slide generation:
  - Slide Index: ${input.slideIndex + 1} of ${input.totalSlides}
  - Title: "${input.title}"
  - Outline Item: "${input.outlineItem}"
  - Required Component: <${requiredComponent}>
  - Layout: "${layout}"
  - Language: "${input.language}", Tone: "${input.tone}"`,
  );

  let retries = 0;
  let lastReason = "Unknown validation failure";
  let xml = "";
  const attemptLogs: string[] = [];

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

    const isFinalRetry = retries === MAX_RETRIES;
    console.log(
      `[generateSingleSlide] Attempt ${retries + 1}/${MAX_RETRIES + 1} (Final attempt: ${isFinalRetry})`,
    );

    let text = "";
    try {
      const response = await generateText({
        model: input.model,
        prompt,
        temperature: retries > 0 ? 0.4 : 0.7,
      });
      text = response.text;
    } catch (apiError) {
      const errMsg = `API call failed on attempt ${retries + 1}: ${apiError instanceof Error ? apiError.message : String(apiError)}`;
      console.error(`[generateSingleSlide] ${errMsg}`);
      attemptLogs.push(errMsg);
      lastReason = errMsg;
      retries++;
      continue;
    }

    xml = stripXmlFromResponse(text);
    if (!xml.includes("</SECTION>") && xml.includes("<SECTION")) {
      xml = `${xml}</SECTION>`;
    }
    if (!xml.startsWith("<PRESENTATION")) {
      xml = `<PRESENTATION>${xml}</PRESENTATION>`;
    }

    const truncatedText =
      text.length > 1500
        ? `${text.substring(0, 1500)}\n...[TRUNCATED]...`
        : text;
    const truncatedXml =
      xml.length > 1500 ? `${xml.substring(0, 1500)}\n...[TRUNCATED]...` : xml;
    const logEntry = `--- ATTEMPT ${retries + 1} ---
[RAW MODEL RESPONSE]:
${truncatedText}
[STRIPPED XML]:
${truncatedXml}`;

    attemptLogs.push(logEntry);

    // 1. XML Schema & Tag Validation
    const xmlValidation = validateSlideXml(xml, requiredComponent);
    if (!xmlValidation.valid) {
      lastReason = xmlValidation.reason ?? "Invalid XML";
      const failureMsg = `XML Validation FAILED: ${lastReason}`;
      console.warn(`[generateSingleSlide] ${failureMsg}`);
      attemptLogs.push(failureMsg);
      retries++;
      continue;
    }

    // 2. Parser Execution
    const parser = new SlideParser();
    parser.parseChunk(xml);
    parser.finalize();
    const slides = parser.getAllSlides();
    const slide = slides[slides.length - 1] ?? slides[0];

    if (!slide) {
      lastReason = "Parser produced no slide";
      const failureMsg = "Parser FAILED to produce a slide object";
      console.warn(`[generateSingleSlide] ${failureMsg}`);
      attemptLogs.push(failureMsg);
      retries++;
      continue;
    }

    // 3. PlateJS Content & Rich Component Validation
    let contentValidation = validateSlideContent(slide, requiredComponent);
    if (!contentValidation.valid) {
      lastReason = contentValidation.reason ?? "Invalid slide content";
      const failureMsg = `Content Validation FAILED: ${lastReason}. Parsed content structure: ${JSON.stringify(slide.content, null, 2)}`;

      if (isFinalRetry) {
        console.warn(
          `[generateSingleSlide] Final attempt content validation failed: "${lastReason}". Relaxing validation to prevent 500 crash.`,
        );
        // Relax: if it has any content at all, accept it!
        if (slide.content && slide.content.length > 0) {
          console.log(
            `[generateSingleSlide] Relaxed validation succeeded: slide has ${slide.content.length} content nodes.`,
          );
          contentValidation = { valid: true };
        } else {
          console.error(
            `[generateSingleSlide] Even relaxed validation failed: slide content is empty.`,
          );
        }
      } else {
        console.warn(`[generateSingleSlide] ${failureMsg}`);
        attemptLogs.push(failureMsg);
        retries++;
        continue;
      }
    }

    // Double check if validation was successful (either normally or relaxed)
    if (contentValidation.valid) {
      console.log(
        `[generateSingleSlide] Slide generation succeeded on attempt ${retries + 1}!`,
      );
      const sectionMatch = xml.match(/<SECTION[\s\S]*?<\/SECTION>/i);
      return {
        xml: sectionMatch?.[0] ?? xml,
        slideIndex: input.slideIndex,
        requiredComponent,
        layout,
        retries,
      };
    }

    retries++;
  }

  // If we reach here, all retries failed
  const errorDetails = `Failed to generate valid slide after ${MAX_RETRIES + 1} attempts.
Last failure reason: ${lastReason}
Slide Details:
  - Slide Index: ${input.slideIndex + 1} of ${input.totalSlides}
  - Title: "${input.title}"
  - Required Component: <${requiredComponent}>
  - Layout: "${layout}"

================ FULL ATTEMPT LOGS ================
${attemptLogs.join("\n\n")}
===================================================`;

  console.error(`[generateSingleSlide] CRITICAL: ${errorDetails}`);

  throw new Error(
    `Failed to generate valid slide after ${MAX_RETRIES + 1} attempts: ${lastReason}. Detail: Slide index ${input.slideIndex + 1}, component <${requiredComponent}>.`,
  );
}
