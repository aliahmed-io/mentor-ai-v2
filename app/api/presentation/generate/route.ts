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

    // ── Phase 1 + 2: Full Deck Parallel Generation (SSE Stream) ────────────
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
        `[generate/route] Starting Phase 2: Parallel Slot Filling Stream...`,
      );

      const slideTasks = orchestration.map((blueprint, index) => {
        const override = slideOverrides?.[outline[index]];
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

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send orchestration data first
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "orchestration", data: orchestration })}\n\n`,
              ),
            );

            const CONCURRENCY_LIMIT = 3;
            for (let i = 0; i < slideTasks.length; i += CONCURRENCY_LIMIT) {
              const batchIndices = Array.from(
                { length: Math.min(CONCURRENCY_LIMIT, slideTasks.length - i) },
                (_, k) => i + k,
              );

              console.log(
                `[generate/route] Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1} (${batchIndices.length} slides)...`,
              );

              await Promise.all(
                batchIndices.map(async (index) => {
                  const task = slideTasks[index];
                  try {
                    const result = await task();
                    const slideLayout =
                      layout ?? (index % 2 === 0 ? "left" : "right");
                    const slideData = {
                      ...result,
                      slideIndex: index,
                      layoutPercentages: orchestration[index].layoutPercentages,
                      xml: generatedSlideToXml(result, slideLayout),
                    };
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "slide", data: slideData })}\n\n`,
                      ),
                    );
                  } catch (error) {
                    console.error(
                      `[generate/route] Slide ${index + 1} generation failed:`,
                      error,
                    );
                    const errorSlide = {
                      templateId: orchestration[index].templateId,
                      slideIndex: index,
                      slots: [],
                      error: "Generation failed",
                      xml: `<SECTION layout="left"><H2>Error</H2><P>Generation failed for this slide.</P></SECTION>`,
                    };
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "slide", data: errorSlide })}\n\n`,
                      ),
                    );
                  }
                }),
              );

              if (i + CONCURRENCY_LIMIT < slideTasks.length) {
                await new Promise((r) => setTimeout(r, 2000));
              }
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
            );
            controller.close();
          } catch (err) {
            console.error("Stream error:", err);
            controller.error(err);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
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
