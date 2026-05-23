import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { orchestrateDeck } from "@/lib/presentation/deck-orchestrator";
import {
  resolvePresentationModel,
  type TextModelTier,
} from "@/lib/presentation/generate-model";
import { generateSingleSlide } from "@/lib/presentation/generate-slide";
import { generatedSlideToXml } from "@/lib/presentation/slots-to-xml";
import { auth } from "@/server/auth";

const slidesRequestSchema = z.object({
  mode: z.enum(["deck", "slide"]).optional().default("slide"),
  title: z.string().min(1, "Title is required"),
  prompt: z.string().optional().default("No specific prompt provided"),
  outline: z.array(z.string()).optional(),
  outlineItem: z.string().optional(),
  slideIndex: z.number().int().min(0).optional(),
  totalSlides: z.number().int().min(1).optional(),
  language: z.string().min(1, "Language is required"),
  tone: z.string().optional().default("professional"),
  theme: z.string().optional().default("mystique"),
  searchResults: z
    .array(
      z.object({
        query: z.string().default(""),
        results: z.array(z.unknown()).default([]),
      }),
    )
    .optional(),
  textModel: z
    .enum(["gemini", "openai", "quality"])
    .optional()
    .default("gemini"),
  templateId: z.string().optional(),
  creativeBrief: z.string().optional(),
  layout: z.string().optional(),
  slideOverrides: z
    .record(
      z.object({
        templateId: z.string().optional(),
        customPrompt: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = slidesRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const {
      mode,
      title,
      prompt: userPrompt,
      outline,
      outlineItem,
      slideIndex,
      totalSlides,
      language,
      tone,
      theme,
      searchResults,
      textModel,
      templateId,
      creativeBrief,
      layout,
      slideOverrides,
    } = validationResult.data;

    const cookieStore = await cookies();
    const geminiKey =
      cookieStore.get("gemini_api_key")?.value || process.env.GEMINI_API_KEY;
    const openaiKey =
      cookieStore.get("openai_api_key")?.value || process.env.OPENAI_API_KEY;

    const model = resolvePresentationModel(textModel as TextModelTier, {
      geminiKey,
      openaiKey,
    });

    if (!model) {
      return NextResponse.json(
        {
          error:
            "No API key configured. Please add your Gemini or OpenAI API key in Settings.",
        },
        { status: 500 },
      );
    }

    // ── Phase 1 + 2: Full Deck Parallel Generation ────────────
    if (mode === "deck") {
      if (!outline?.length) {
        return NextResponse.json(
          { error: "Outline is required for deck mode" },
          { status: 400 },
        );
      }

      console.log(`[generate/route] Starting Phase 1: Orchestration...`);
      const orchestration = await orchestrateDeck({
        model,
        title,
        outline,
        theme,
        tone,
        language,
      });

      console.log(
        `[generate/route] Phase 1 Complete. Orchestrated ${orchestration.length} slides.`,
      );
      console.log(
        `[generate/route] Starting Phase 2: Parallel Slot Filling...`,
      );

      // Map into factory functions so they don't execute immediately
      const slideTasks = orchestration.map((blueprint, index) => {
        const override = slideOverrides?.[(index + 1).toString()];
        const finalTemplateId = override?.templateId || blueprint.templateId;
        const finalCreativeBrief = override?.customPrompt
          ? `${blueprint.creativeBrief}\nUSER INSTRUCTION: ${override.customPrompt}`
          : blueprint.creativeBrief;

        return () =>
          generateSingleSlide({
            model,
            title,
            outlineItem: outline[index],
            slideIndex: index,
            totalSlides: outline.length,
            language,
            tone,
            templateId: finalTemplateId,
            creativeBrief: finalCreativeBrief,
          });
      });

      // Process in batches of 3 to avoid hitting Gemini free tier rate limits (429)
      const CONCURRENCY_LIMIT = 3;
      const settledResults: PromiseSettledResult<any>[] = [];

      for (let i = 0; i < slideTasks.length; i += CONCURRENCY_LIMIT) {
        const batch = slideTasks.slice(i, i + CONCURRENCY_LIMIT);
        console.log(
          `[generate/route] Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1} (${batch.length} slides)...`,
        );

        const results = await Promise.allSettled(batch.map((task) => task()));
        settledResults.push(...results);

        // Small delay between batches to respect RPM limits
        if (i + CONCURRENCY_LIMIT < slideTasks.length) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      const slides = settledResults.map((res, index) => {
        if (res.status === "fulfilled") {
          const slideLayout = layout ?? (index % 2 === 0 ? "left" : "right");
          return {
            ...res.value,
            slideIndex: index,
            layoutPercentages: orchestration[index].layoutPercentages,
            xml: generatedSlideToXml(res.value, slideLayout),
          };
        } else {
          console.error(
            `[generate/route] Slide ${index + 1} generation failed:`,
            res.reason,
          );
          // Return a fallback blank slide matching the template if generation fails
          return {
            templateId: orchestration[index].templateId,
            slideIndex: index,
            slots: [],
            error: "Generation failed",
            xml: `<SECTION layout="left"><H2>Error</H2><P>Generation failed for this slide.</P></SECTION>`,
          };
        }
      });

      return NextResponse.json({
        slides,
        orchestration,
      });
    }

    // ── Single Slide Generation (for Retries/Edits) ────────────
    if (mode === "slide") {
      const effectiveOutline = outline ?? [];
      const index = slideIndex ?? 0;
      const item =
        outlineItem ?? effectiveOutline[index] ?? `Slide ${index + 1}`;
      const total = totalSlides ?? (effectiveOutline.length || 1);

      const activeTemplateId = templateId ?? "title-hero";
      const activeBrief =
        creativeBrief ?? "Generate generic content based on the outline topic.";
      const activeLayout = layout ?? "left";

      try {
        const result = await generateSingleSlide({
          model,
          title,
          outlineItem: item,
          slideIndex: index,
          totalSlides: total,
          language,
          tone,
          templateId: activeTemplateId,
          creativeBrief: activeBrief,
        });

        return NextResponse.json({
          ...result,
          slideIndex: index,
          xml: generatedSlideToXml(result, activeLayout),
        });
      } catch (error) {
        console.error("Single slide generation failed:", error);
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate slide",
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Error in presentation generation:", error);
    return NextResponse.json(
      { error: "Failed to generate presentation slides" },
      { status: 500 },
    );
  }
}
