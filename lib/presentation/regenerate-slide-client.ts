import type { PlateSlide } from "@/components/presentation/utils/parser";
import { SlideParser } from "@/components/presentation/utils/parser";
import { bakeThemeIntoSlides } from "./apply-theme-to-slides";
import {
  getLayoutForSlide,
  getRequiredComponent,
  type RichComponent,
} from "./layout-recipes";

export interface RegenerateSlideParams {
  slideIndex: number;
  outlineItem: string;
  title: string;
  prompt: string;
  outline: string[];
  language: string;
  tone: string;
  textModel: string;
  searchResults?: Array<{ query: string; results: unknown[] }>;
  requiredComponent?: RichComponent;
}

export async function regenerateSlideFromApi(
  params: RegenerateSlideParams,
): Promise<PlateSlide | null> {
  const requiredComponent =
    params.requiredComponent ??
    getRequiredComponent(params.tone, params.slideIndex);
  const layout = getLayoutForSlide(params.slideIndex);

  const response = await fetch("/api/presentation/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "slide",
      title: params.title,
      prompt: params.prompt,
      outline: params.outline,
      outlineItem: params.outlineItem,
      slideIndex: params.slideIndex,
      totalSlides: params.outline.length,
      requiredComponent,
      layout,
      searchResults: params.searchResults,
      language: params.language,
      tone: params.tone,
      textModel: params.textModel,
    }),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error?: string };
    throw new Error(err.error ?? "Regeneration failed");
  }

  const { xml } = (await response.json()) as { xml: string };
  const wrapped = xml.includes("<PRESENTATION")
    ? xml
    : `<PRESENTATION>${xml}</PRESENTATION>`;

  const parser = new SlideParser();
  parser.parseChunk(wrapped);
  parser.finalize();
  const parsed = parser.getAllSlides();
  return parsed[parsed.length - 1] ?? parsed[0] ?? null;
}

export function mergeRegeneratedSlide(
  slides: PlateSlide[],
  index: number,
  newSlide: PlateSlide,
  themeKey: string,
  colorMode: "light" | "dark",
  customThemeData: Parameters<typeof bakeThemeIntoSlides>[3],
  typography?: { heading?: string; body?: string },
): PlateSlide[] {
  const previous = slides[index];
  const merged: PlateSlide = {
    ...newSlide,
    id: previous?.id ?? newSlide.id,
    bgColor: previous?.bgColor,
    width: previous?.width ?? newSlide.width,
    alignment: previous?.alignment ?? newSlide.alignment,
    rootImage: newSlide.rootImage
      ? {
          ...newSlide.rootImage,
          url: previous?.rootImage?.url,
          cropSettings: previous?.rootImage?.cropSettings,
        }
      : previous?.rootImage,
  };
  const next = [...slides];
  next[index] = merged;
  return bakeThemeIntoSlides(
    next,
    themeKey,
    colorMode,
    customThemeData,
    typography,
  );
}
