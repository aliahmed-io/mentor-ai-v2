import { orchestrateDeck } from "./lib/presentation/deck-orchestrator";
import { generateSingleSlide } from "./lib/presentation/generate-slide";
import { resolvePresentationModel } from "./lib/presentation/generate-model";

async function runTest() {
  console.log("Starting test...");
  
  const model = resolvePresentationModel("gemini", { geminiKey: process.env.GEMINI_API_KEY });
  if (!model) {
    console.error("No model. Make sure GEMINI_API_KEY is in .env");
    return;
  }

  const title = "Test Presentation";
  const theme = "Modern";
  const tone = "Professional";
  const language = "en-US";
  const outline = [
    "# 1. Introduction",
  ];

  try {
    console.log("Running orchestrator...");
    const slides = await orchestrateDeck({
      model,
      title,
      outline,
      theme,
      tone,
      language
    });
    console.log("Orchestration Success!", JSON.stringify(slides, null, 2));

    console.log("Running Phase 2: generateSingleSlide on slide 1");
    const slideGen = await generateSingleSlide({
      model,
      blueprint: slides[0],
      slideIndex: 0,
      totalSlides: 1,
      presentationContext: { title, theme, tone, language }
    });
    console.log("Slide 1 Gen Success!", JSON.stringify(slideGen, null, 2));

  } catch (err) {
    console.error("Test Failed!", err);
  }
}

runTest();
