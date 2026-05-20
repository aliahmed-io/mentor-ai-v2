import { streamText } from "ai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { formatSearchResults } from "@/lib/presentation/generate-prompts";
import { generateSingleSlide } from "@/lib/presentation/generate-slide";
import {
  resolvePresentationModel,
  type TextModelTier,
} from "@/lib/presentation/generate-model";
import {
  getLayoutForSlide,
  getRequiredComponent,
  type RichComponent,
} from "@/lib/presentation/layout-recipes";
import { auth } from "@/server/auth";

const slidesRequestSchema = z.object({
  mode: z.enum(["deck", "slide"]).optional().default("slide"),
  title: z.string().min(1, "Title is required"),
  prompt: z.string().optional().default("No specific prompt provided"),
  outline: z.array(z.string()).optional(),
  outlineItem: z.string().optional(),
  slideIndex: z.number().int().min(0).optional(),
  totalSlides: z.number().int().min(1).optional(),
  requiredComponent: z.string().optional(),
  layout: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  tone: z.string().optional().default("professional"),
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
});

// Use AI SDK types for proper type safety

interface SlidesRequest {
  title: string; // Generated presentation title
  prompt: string; // Original user prompt/request
  outline: string[]; // Array of main topics with markdown content
  language: string; // Language to use for the slides
  tone: string; // Style for image queries (optional)
  searchResults?: Array<{ query: string; results: unknown[] }>; // Search results for context
  textModel?: "gemini" | "openai";
}
const slidesTemplate = `
You are an expert presentation designer. Your task is to create a premium, engaging presentation in XML format.
The output MUST look visually dense, high-quality, and highly professional, resembling outputs from premium tools like Gamma or Tome.

## CORE REQUIREMENTS

1. FORMAT: Output valid XML wrapped inside <PRESENTATION>...</PRESENTATION>.
2. STRUCTURE: Each slide must be defined by a <SECTION layout="left" | "right" | "vertical"> tag.
3. VISUAL RICHNESS: Every slide MUST include at least ONE rich layout component (e.g. <BULLETS>, <ICONS>, <CHART>, <TABLE>, <TIMELINE>, etc.) in addition to the slide heading and intro paragraph. Do NOT output slides with only a heading and a paragraph.
4. DETAILED IMAGES: Every slide MUST include a highly descriptive <IMG query="..." /> tag. The query must be 10-15+ words, specifying context, style, lighting, and composition (e.g. "aerial drone shot of modern sustainable smart city, solar panel roofs, vertical gardens, golden hour light, high realism"). No generic terms like "technology" or "business".
5. LAYOUT VARIETY:
   - Alternate the layout attribute of <SECTION> (left, right, vertical) so consecutive slides do not use the same layouts.
   - Do NOT repeat the same rich component (e.g., <BULLETS> or <ICONS>) on consecutive slides. Ensure a healthy mix.

## PRESENTATION DETAILS
- Title: {TITLE}
- User's Original Request: {PROMPT}
- Current Date: {CURRENT_DATE}
- Outline (for reference): {OUTLINE_FORMATTED}
- Language: {LANGUAGE}
- Style/Tone: {TONE}
- Total Slides: {TOTAL_SLIDES}

## RESEARCH CONTEXT
{SEARCH_RESULTS}

## STYLE & TONE GUIDELINES (Based on Style: {TONE})
Use the selected style ({TONE}) to shape both the layout selection and written tone:
- **professional**: Focus on analytical, structured data. Use a formal, objective tone. Layout preferences: <CHART>, <TABLE>, <COMPARE>, <ARROW-VERTICAL>, <COLUMNS>.
- **creative**: Focus on storytelling, vision, and processes. Use a dynamic, inspiring tone. Layout preferences: <ICONS>, <CYCLE>, <TIMELINE>, <PYRAMID>, <BEFORE-AFTER>.
- **minimal**: Focus on clarity, whitespace, and conciseness. Keep descriptions punchy. Layout preferences: <BULLETS>, <BOXES>, <COMPARE>.
- **bold**: Focus on conviction, high impact, and strong assertions. Use direct, powerful language. Layout preferences: <STAIRCASE>, <PYRAMID>, <PROS-CONS>, <ARROWS>.
- **elegant**: Focus on luxury, refinement, and flow. Use sophisticated, high-level vocabulary. Layout preferences: <TIMELINE>, <COLUMNS>, <BEFORE-AFTER>, <TABLE>.

## SLIDE RECIPES (LAYOUT PATTERNS)
To ensure the deck is balanced, follow this slide flow recipe:
- **Slide 1 (Introduction/Title)**: Use <SECTION layout="vertical">. Include <H1>Title</H1>, <P>Subheading/Overview</P>, and <IMG> query depicting the core theme. Optionally use a <BOXES> or <COLUMNS> for intro stats/agenda.
- **Slide 2 (Context/Problem)**: Use layout="left" or "right". Include <H2>Problem/Opportunity</H2>, <P>Introduction</P>, followed by a <COMPARE> or <BEFORE-AFTER> or <PROS-CONS> to contrast states.
- **Slide 3 (Core Concept/Solution)**: Use layout="vertical" or "left". Include <H2>Core Solution</H2>, <P>Introduction</P>, followed by a dense layout like <BULLETS> or <ICONS> (3-4 points, each with H3 and P).
- **Slide 4 (Process/Workflow/Timeline)**: Use layout="right" or "vertical". Include <H2>How It Works</H2>, <P>Phase details</P>, followed by <CYCLE>, <TIMELINE>, <ARROW-VERTICAL>, or <STAIRCASE>.
- **Slide 5 (Data/Evidence)**: Use layout="left" or "right". Include <H2>Key Metrics & Data</H2>, <P>Analysis description</P>, followed by a <CHART> (with 4+ data points) or a structured <TABLE>.
- **Slide 6+ (Deep Dive/Wrap-up/Summary)**: Use layout="vertical". Include <H2>Conclusion & Future Outlook</H2>, <P>Summary narrative</P>, followed by a <BOXES> or <PYRAMID> or <ARROWS> summarizing next steps.

## AVAILABLE LAYOUT COMPONENTS (XML SCHEMA)

Use these EXACT XML tags for slide content. Do not invent tags or change their attributes.

1. COLUMNS: For comparisons or side-by-side concepts
\`\`\`xml
<COLUMNS>
  <DIV><H3>Concept A</H3><P>Detailed description of concept A including key metrics or traits.</P></DIV>
  <DIV><H3>Concept B</H3><P>Detailed description of concept B including key metrics or traits.</P></DIV>
</COLUMNS>
\`\`\`

2. BULLETS: For dense bullet points (each bullet item MUST have an H3 and a P)
\`\`\`xml
<BULLETS>
  <DIV><H3>First Focus Area</H3><P>Actionable description and context about this specific area.</P></DIV>
  <DIV><H3>Second Focus Area</H3><P>Actionable description and context about this specific area.</P></DIV>
  <DIV><H3>Third Focus Area</H3><P>Actionable description and context about this specific area.</P></DIV>
</BULLETS>
\`\`\`

3. ICONS: For lists featuring visual symbols
\`\`\`xml
<ICONS>
  <DIV><ICON query="rocket" /><H3>Acceleration</H3><P>Detailed description of rapid growth or deployment.</P></DIV>
  <DIV><ICON query="shield" /><H3>Robust Security</H3><P>Detailed description of defense-in-depth security measures.</P></DIV>
  <DIV><ICON query="cpu" /><H3>AI Integration</H3><P>Detailed description of custom model deployments.</P></DIV>
</ICONS>
\`\`\`
Available standard query strings for ICON query: rocket, shield, cpu, activity, alert-circle, award, bar-chart-2, book, briefcase, calendar, check-circle, cloud, code, database, eye, file-text, globe, heart, help-circle, image, info, key, layers, lock, mail, map-pin, message-square, music, paperclip, phone, play, plus, power, search, settings, share-2, shopping-cart, star, target, trash-2, trending-up, user, users, video, wifi, zap.

4. CYCLE: For circular workflows or ongoing processes
\`\`\`xml
<CYCLE>
  <DIV><H3>1. Research</H3><P>Analyze target audience, competitor landscape, and requirements.</P></DIV>
  <DIV><H3>2. Design</H3><P>Iterate on UI/UX mockups, design tokens, and accessibility standards.</P></DIV>
  <DIV><H3>3. Build</H3><P>Implement components using responsive frameworks and strict type safety.</P></DIV>
  <DIV><H3>4. Optimize</H3><P>Monitor performance metrics, loading speeds, and user engagement.</P></DIV>
</CYCLE>
\`\`\`

5. ARROWS: For horizontal cause-effect/sequential steps
\`\`\`xml
<ARROWS>
  <DIV><H3>Step 1: Input</H3><P>Collect telemetry and user interaction datasets.</P></DIV>
  <DIV><H3>Step 2: Process</H3><P>Aggregate logs, sanitize inputs, and run inference.</P></DIV>
  <DIV><H3>Step 3: Outcome</H3><P>Serve customized recommendations dynamically.</P></DIV>
</ARROWS>
\`\`\`

6. ARROW-VERTICAL: For step-by-step linear phases
\`\`\`xml
<ARROW-VERTICAL>
  <DIV><H3>Phase A: Discovery</H3><P>Conduct user interviews and technical feasibility audit.</P></DIV>
  <DIV><H3>Phase B: Prototyping</H3><P>Create interactive wires and test core hypotheses.</P></DIV>
  <DIV><H3>Phase C: Launch</H3><P>Deploy to production under monitoring and alerts.</P></DIV>
</ARROW-VERTICAL>
\`\`\`

7. TIMELINE: For chronological sequences or milestones
\`\`\`xml
<TIMELINE>
  <DIV><H3>Q1 2026</H3><P>Foundation setup, state machine design, and DB schema creation.</P></DIV>
  <DIV><H3>Q2 2026</H3><P>Beta release, security audit, and accessibility compliance testing.</P></DIV>
  <DIV><H3>Q3 2026</H3><P>Global launch, translation pipeline integration, and SEO optimization.</P></DIV>
</TIMELINE>
\`\`\`

8. PYRAMID: For hierarchical data, priorities, or structures
\`\`\`xml
<PYRAMID>
  <DIV><H3>Top: Vision</H3><P>Empower every learner with hyper-personalized AI tutors.</P></DIV>
  <DIV><H3>Middle: Strategy</H3><P>Deploy real-time analysis tools and interactive quizzes.</P></DIV>
  <DIV><H3>Base: Technology</H3><P>Leverage next-gen frameworks, edge functions, and robust DB tables.</P></DIV>
</PYRAMID>
\`\`\`

9. STAIRCASE: For progressive levels or maturity stages
\`\`\`xml
<STAIRCASE>
  <DIV><H3>Level 1: Ad-Hoc</H3><P>Manual processes, high error rates, and fragmented operations.</P></DIV>
  <DIV><H3>Level 2: Standardized</H3><P>Documented workflows, shared libraries, and basic CI verification.</P></DIV>
  <DIV><H3>Level 3: Optimized</H3><P>Predictive scaling, automated recovery, and continuous improvements.</P></DIV>
</STAIRCASE>
\`\`\`

10. BOXES: For structured grid tiles of information
\`\`\`xml
<BOXES>
  <DIV><H3>Scale</H3><P>Easily support 100k+ concurrent websocket requests.</P></DIV>
  <DIV><H3>Security</H3><P>End-to-end encryption and compliance certifications.</P></DIV>
  <DIV><H3>Performance</H3><P>Sub-100ms response times for AI inferences.</P></DIV>
</BOXES>
\`\`\`

11. COMPARE: For side-by-side comparisons (use <LI> items for lists)
\`\`\`xml
<COMPARE>
  <DIV><H3>Traditional SaaS</H3><LI>High license cost</LI><LI>Slow custom integrations</LI><LI>Fragile layout rendering</LI></DIV>
  <DIV><H3>Mentor-AI</H3><LI>Predictable pay-as-you-use</LI><LI>Instant API connections</LI><LI>Robust, responsive layout blocks</LI></DIV>
</COMPARE>
\`\`\`

12. BEFORE-AFTER: For highlighting transformation results
\`\`\`xml
<BEFORE-AFTER>
  <DIV><H3>Before Deployment</H3><P>Scattered data silos, manually configured triggers, and 2-hour build delays.</P></DIV>
  <DIV><H3>After Deployment</H3><P>Unified database interface, automated pipelines, and instant sub-second hot updates.</P></DIV>
</BEFORE-AFTER>
\`\`\`

13. PROS-CONS: For analyzing trade-offs (use <LI> items inside <PROS> and <CONS>)
\`\`\`xml
<PROS-CONS>
  <PROS><H3>Advantages</H3><LI>Rapid prototyping</LI><LI>Direct UI components access</LI></PROS>
  <CONS><H3>Limitations</H3><LI>Requires initial learning curve</LI><LI>Requires modern browser support</LI></CONS>
</PROS-CONS>
\`\`\`

14. TABLE: For highly structured tabular data
\`\`\`xml
<TABLE>
  <TR><TH>Metric</TH><TH>Vite App</TH><TH>Next.js App</TH></TR>
  <TR><TD>TTFB</TD><TD>180ms</TD><TD>45ms</TD></TR>
  <TR><TD>LCP</TD><TD>2.2s</TD><TD>1.1s</TD></TR>
</TABLE>
\`\`\`

15. CHARTS: For plotting trends (bar, pie, line, area, radar). Scatter uses X and Y.
\`\`\`xml
<CHART charttype="bar">
  <DATA><LABEL>Q1 Sales</LABEL><VALUE>150</VALUE></DATA>
  <DATA><LABEL>Q2 Sales</LABEL><VALUE>280</VALUE></DATA>
  <DATA><LABEL>Q3 Sales</LABEL><VALUE>420</VALUE></DATA>
  <DATA><LABEL>Q4 Sales</LABEL><VALUE>610</VALUE></DATA>
</CHART>
\`\`\`

## CRITICAL OUTPUT CONSTRAINTS
1. Output EXACTLY {TOTAL_SLIDES} sections (slides). Do not output more or less.
2. Every slide section MUST be wrapped in:
   <SECTION layout="left" | "right" | "vertical">
     <H2>Slide Title</H2>
     <P>Introductory sentence expanding on the topic...</P>
     [Insert ONE appropriate rich layout component here]
     <IMG query="detailed description..." />
   </SECTION>
3. The content must be detailed, complete, and fully fleshed out. Never write placeholders, "TODO", or generic text.
4. Output ONLY valid XML code within the \`\`\`xml block. Do not include extra conversational text outside the XML.

Now create a complete, stunning XML presentation with EXACTLY {TOTAL_SLIDES} slides.
`;

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
      requiredComponent: requiredComponentRaw,
      layout: layoutOverride,
      language,
      tone,
      searchResults,
      textModel,
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

    // Per-slide generation (default)
    if (mode === "slide") {
      const effectiveOutline = outline ?? [];
      const index = slideIndex ?? 0;
      const item =
        outlineItem ??
        effectiveOutline[index] ??
        `Slide ${index + 1}`;
      const total = totalSlides ?? (effectiveOutline.length || 1);
      const required = (requiredComponentRaw ??
        getRequiredComponent(tone, index)) as RichComponent;
      const layout = layoutOverride ?? getLayoutForSlide(index);

      try {
        const result = await generateSingleSlide({
          model,
          title,
          prompt: userPrompt || "No specific prompt provided",
          outlineItem: item,
          slideIndex: index,
          totalSlides: total,
          language,
          tone,
          searchResults,
          requiredComponent: required,
          layout,
        });

        return NextResponse.json(result);
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

    // Legacy full-deck streaming
    if (!outline?.length) {
      return NextResponse.json(
        { error: "Outline is required for deck mode" },
        { status: 400 },
      );
    }

    const searchResultsText = formatSearchResults(searchResults);
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedPrompt = slidesTemplate
      .replace(/{TITLE}/g, title)
      .replace(/{PROMPT}/g, userPrompt || "No specific prompt provided")
      .replace(/{CURRENT_DATE}/g, currentDate)
      .replace(/{LANGUAGE}/g, language)
      .replace(/{TONE}/g, tone)
      .replace(/{OUTLINE_FORMATTED}/g, outline.join("\n\n"))
      .replace(/{TOTAL_SLIDES}/g, outline.length.toString())
      .replace(/{SEARCH_RESULTS}/g, searchResultsText);

    const result = streamText({
      model,
      prompt: formattedPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in presentation generation:", error);
    return NextResponse.json(
      { error: "Failed to generate presentation slides" },
      { status: 500 },
    );
  }
}
