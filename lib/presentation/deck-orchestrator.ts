import { generateObject, type LanguageModel } from "ai";
import {
  DeckOrchestrationResult,
  TEMPLATES,
  type SlideBlueprint,
} from "./layout-templates";

export interface DeckOrchestrationParams {
  model: LanguageModel;
  title: string;
  outline: string[];
  theme: string;
  tone: string;
  language: string;
}

export async function orchestrateDeck(
  params: DeckOrchestrationParams
): Promise<SlideBlueprint[]> {
  const { model, title, outline, theme, tone, language } = params;

  // Compile a small list of available templates to prompt the LLM
  const availableTemplates = TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));

  const systemPrompt = `
You are a master Presentation Art Director. Your job is to orchestrate a slide deck by assigning the perfect visual template and creative direction to each slide in the outline.

## PRESENTATION CONTEXT
- Title: ${title}
- Theme: ${theme}
- Tone: ${tone}
- Language: ${language}

## OUTLINE
${outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}

## AVAILABLE TEMPLATES
${JSON.stringify(availableTemplates, null, 2)}

## ORCHESTRATION RULES
1. First slide MUST use "title-hero".
2. Last slide MUST use "closing-cta".
3. NEVER repeat the same template on consecutive slides.
4. Match data-heavy topics to chart or table templates.
5. Match process/workflow topics to timeline, cycle, or arrow templates.
6. Provide a concise creative brief for each slide directing the content writer on visual focus.

Return a JSON array of slide blueprints, exactly matching the schema.
`;

  const { object } = await generateObject({
    model,
    schema: DeckOrchestrationResult,
    system: systemPrompt,
    prompt: "Orchestrate the slide deck now.",
    temperature: 0.7,
  });

  return object.slides;
}
