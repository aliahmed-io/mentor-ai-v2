# Presentation Architecture v2.0: Template-Driven & Agentic Orchestration

> **Status:** Approved — Revised for High-Creativity & Low Latency  
> **Last Updated:** 2026-05-21

---

## Table of Contents

1. [Core Philosophy: The "Art Director" Model](#1-core-philosophy-the-art-director-model)
2. [The Generation Pipeline (Two-Phase Parallel)](#2-the-generation-pipeline-two-phase-parallel)
3. [The Content Safety Net (Handling Overflow)](#3-the-content-safety-net-handling-overflow)
4. [V1 Core 15 Template Catalog](#4-v1-core-15-template-catalog)
5. [Full 55-Template Expansion Catalog](#5-full-55-template-expansion-catalog)
6. [TypeScript & Zod Implementation](#6-typescript--zod-implementation)
7. [CSS Grid & Styling Strategy](#7-css-grid--styling-strategy)
8. [File Changes Map](#8-file-changes-map)
9. [Implementation Order](#9-implementation-order)
10. [Verification Plan](#10-verification-plan)

---

## 1. Core Philosophy: The "Art Director" Model

To achieve Gamma-level creativity without breaking the 16:9 boundary, we separate **Orchestration** (deciding *how* to tell the story visually) from **Execution** (filling in the exact words).

Instead of constraining the AI, we turn it into an Art Director. We give it a massive palette of visual tools (templates) and let it decide whether a concept is best explained via a timeline, a sweeping cinematic image, a data chart, or a minimalist quote.

### Fixes from V1 of this Plan

| Problem | V1 Approach | V2 Fix |
|:---|:---|:---|
| **Latency** | Sequential slide-by-slide template selection | Single "Deck Orchestration" batch call → parallel slot filling |
| **LLM Word Counting** | Relied on LLM to respect word limits | Programmatic truncation — LLMs tokenize, they don't count words |
| **JSON Reliability** | Raw text prompts hoping for valid JSON | Strict Zod schemas + LLM Structured Outputs |
| **Scope Creep** | 55 templates all at once | **Core 15** for V1 launch, architecture open for the remaining 40 |
| **Rigid Layouts** | Static columns (e.g. left, right) | Draggable Splits using Shadcn `resizable-panel-group` |

---

## 2. The Generation Pipeline (Two-Phase Parallel)

### Current Flow (Broken)

```
User prompt
  → AI generates raw XML slide-by-slide (sequential, ~60s total)
  → XML parsed to Slate nodes
  → Crammed into 16:9 box
  → CSS tries to fix overflow
```

### New Flow (Art Director)

```
User prompt + outline
  → Phase 1: Deck Orchestrator (1 API call, ~3s)
      AI evaluates ENTIRE outline, assigns template + creative brief per slide
  → Phase 2: Parallel Slot Filling (N API calls via Promise.all(), ~8-12s)
      Each slide generated simultaneously, Zod-enforced output
  → Safety Net: Backend truncation for any overflow
  → Render in strict 16:9
```

**Total latency: ~12-15s for a 10-slide deck (down from ~60s+)**

---

### Phase 1: Deck Orchestration (1 API Call)

The AI evaluates the entire presentation outline as a whole and assigns a template and "creative brief" to each slide. This ensures narrative flow, visual variety, and appropriate template selection.

**Input:** Full outline array, topic, tone, language.

**Output (Zod-enforced structured object):** Array of slide blueprints.

```json
[
  {
    "slideNumber": 1,
    "templateId": "title-hero",
    "creativeBrief": "Opening hook. High contrast, focusing on the problem statement."
  },
  {
    "slideNumber": 2,
    "templateId": "timeline-horizontal",
    "creativeBrief": "Map out the 3 phases of evolution. Keep descriptions punchy."
  },
  {
    "slideNumber": 3,
    "templateId": "img-split-left",
    "creativeBrief": "Showcase visual concept of the solution.",
    "layoutPercentages": [45, 55]
  }
]
```

**Orchestration Rules the AI follows:**
- First slide → always a `title-*` template
- Last slide → always a `closing-cta` template
- Never repeat the same template on consecutive slides
- Never use the same category more than twice in a row
- Data-heavy outline items → chart/table templates
- Process/workflow items → timeline/arrow/cycle templates
- Tone shapes selection: professional → charts/tables, creative → icons/cycles, bold → big-number/pyramid

---

### Phase 2: Parallel Slot Filling (N Parallel API Calls)

Using the blueprint array from Phase 1, the backend fires `Promise.all()` to generate all slides simultaneously.

Each call receives:
- The outline item for that slide
- The `creativeBrief` from the orchestrator
- The exact Zod schema for the chosen template (defines slots, types, max lengths)
- Presentation metadata (title, tone, language)

The LLM uses **Structured Outputs** (JSON Schema mode) so the response is guaranteed to match the template's slot structure.

```typescript
const slidePromises = orchestrationResult.map((blueprint, index) =>
  generateSlotContent({
    templateId: blueprint.templateId,
    creativeBrief: blueprint.creativeBrief,
    outlineItem: outline[index],
    schema: getSchemaForTemplate(blueprint.templateId),
    title,
    tone,
    language,
  })
);

const slides = await Promise.all(slidePromises);
```

---

## 3. The Content Safety Net (Handling Overflow)

Since LLMs tokenize rather than count words, we enforce boundaries in three layers:

### Layer 1 — The Soft Limit (Prompt)

Tell the AI to target **~20% fewer words** than the actual max capacity. If a slot holds 50 words, the prompt asks for 40. This gives breathing room and produces tighter copy.

```
Slot [body]: Write a compelling insight. TARGET 40 WORDS (absolute max: 50).
```

### Layer 2 — The Hard Limit (Zod Schema)

Use Zod `.max()` on string lengths and array lengths at the API boundary. When using Structured Outputs, the LLM must conform to the schema or the API rejects the response.

```typescript
const BodySlotSchema = z.object({
  slotId: z.literal("body"),
  type: z.literal("paragraph"),
  text: z.string().max(300), // ~50 words at ~6 chars/word
});
```

### Layer 3 — The Guillotine (Backend Truncation)

If the text still exceeds the visual word budget after Zod validation (possible because char count ≠ word count), a utility function slices the string at the last complete sentence boundary (`.`, `!`, `?`) before the word limit.

```typescript
function truncateToWordBudget(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;

  const truncated = words.slice(0, maxWords).join(" ");
  // Find last sentence boundary
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  );

  if (lastSentenceEnd > truncated.length * 0.5) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }
  return truncated + "…";
}
```

**The Guillotine runs on every slot of every slide, unconditionally, after AI generation.** It is the final guarantee that nothing overflows.

---

## 4. V1 Core 15 Template Catalog

These 15 highly distinct layouts launch first. Selected for maximum creative range with minimum implementation effort. The remaining 40 templates can be added to the database later without changing code.

| ID | Name | Visual Vibe | AI Creative Use Case | Grid | Key Slot Budgets |
|:---|:---|:---|:---|:---|:---|
| `title-hero` | Title Hero | Cinematic, centered, full bleed | High-impact openings, section breaks | 100 centered | H1:10w, P:20w, IMG(bg) |
| `img-split-left` | Image Left + Text | 50/50 image left, text right | Narrative storytelling, concept intros | 50/50 | IMG, H2:8w, P:50w |
| `quote-spotlight` | Quote Spotlight | Massive typography, deep background | Core truth emphasis, testimonials | 100 centered | Quote:30w, Attribution:8w |
| `big-number` | Big Number | One giant metric, minimal text | Shocking statistics, ROI highlights | 100 centered | Number, Label:6w, P:25w |
| `bullets-grid-4` | 4-Bullet Grid | 2×2 modular grid with icons | Features, benefits, 4-point frameworks | 2×2 grid | H2:8w, 4×(Icon + H3:5w + P:15w) |
| `chart-bar-side` | Chart + Text Split | 50% bar chart, 50% insight text | Financials, growth metrics | 50/50 | Chart(5pts), H2:8w, P:40w, Callout:12w |
| `timeline-horizontal` | Timeline Horizontal | 3-4 node horizontal sequence | History, roadmaps, implementation plans | H2 + horiz bar | H2:8w, 4×(H3:5w + P:15w) |
| `compare-vs` | VS Comparison | Split screen, vertical divider | Pros/Cons, Before/After, A vs B | 50/50 | H2:8w, 2×(H3:5w + 3×LI:8w) |
| `process-arrows` | Arrow Flow | Chevron arrows left to right | Step-by-step guides, user journeys | H2 + 3 arrows | H2:8w, 3×(H3:5w + P:15w) |
| `table-insight` | Table + Insight | Clean 3×4 table + takeaway callout | Pricing, specs, feature matrices | 100 stacked | H2:8w, Table(3col×4row, 4w/cell), Callout:20w |
| `text-three-column` | Three-Column Text | 3 equal vertical columns | Core pillars, principles, service tiers | 33/33/33 | H2:8w, 3×(H3:5w + P:25w) |
| `img-bottom-text-top` | Text Top, Image Bottom | Text overhead, wide image anchoring | Showcasing landscapes, dashboards | 40text/60img vert | H2:8w, P:40w, IMG |
| `swot-analysis` | SWOT Analysis | 2×2 grid specifically styled | Strategic planning, positioning | 2×2 grid | H2:8w, 4×(Label:1w + 3×LI:8w) |
| `pyramid-3` | Pyramid (3 levels) | Ascending triangle diagram | Hierarchies, priorities, tech stacks | H2 + pyramid | H2:8w, 3×(H3:5w + P:12w) |
| `closing-cta` | Closing CTA | Clean, high contrast, singular focus | Final ask, QR code, contact info | 100 centered | H2:6w, P:15w, optional link/QR |

---

## 5. Full 55-Template Expansion Catalog

> These are the additional 40 templates to be added post-V1. Kept here as the expansion roadmap. All sourced from PowerPoint, Canva, and Slidesgo proven layouts.

### Category A — Title & Section (remaining: 4)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `title-image-left` | Title + Image Left | Canva | 45img/55text | IMG, H1:10w, P:20w |
| `title-image-right` | Title + Image Right | Canva | 55text/45img | H1:10w, P:20w, IMG |
| `section-header` | Section Header | PPT | 100 centered | H2:8w, P:15w |
| `section-image-bg` | Section + BG Image | Slidesgo | 100 overlay | IMG(bg), H2:8w, P:12w |

### Category B — Text + Content (remaining: 5)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `text-single-para` | Title + Paragraph | PPT | 100 stacked | H2:8w, P:60w |
| `text-two-para` | Title + Two Paragraphs | Canva | 100 stacked | H2:8w, P:40w, P:40w |
| `text-caption-left` | Content + Caption Left | PPT | 35/65 | H3:6w + P:30w, content |
| `text-caption-right` | Content + Caption Right | PPT | 65/35 | content, H3:6w + P:30w |
| `text-two-column` | Two-Column Text | PPT | 50/50 | H2:8w, 2×(H3:5w + P:35w) |

### Category C — Image + Text (remaining: 5)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `img-right-text-left` | Image Right + Text | PPT | 55text/45img | H2:8w, P:50w, IMG |
| `img-top-text-bottom` | Image Top + Text Bottom | Canva | 60img/40text vert | IMG, H2:8w, P:40w |
| `img-left-bullets-right` | Image + Bullets Right | Slidesgo | 40img/60text | IMG, H2:8w, 3×(H3:5w + P:12w) |
| `img-right-bullets-left` | Image + Bullets Left | Slidesgo | 60text/40img | H2:8w, 3×(H3:5w + P:12w), IMG |
| `img-two-col-text-center` | Two Images + Text | Canva | 30/40/30 | IMG, H2:8w + P:35w, IMG |
| `img-fullbleed-overlay` | Full Bleed + Overlay | Canva | 100 img bg | IMG, H2:8w overlay, P:20w overlay |

### Category D — Bullets & Icons (remaining: 4)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `bullets-3-horizontal` | 3-Bullet Horizontal | Canva | H2 + 3-col | H2:8w, 3×(Icon + H3:5w + P:20w) |
| `bullets-3-stack` | 3-Bullet Stack | Slidesgo | 100 stacked | H2:8w, P:20w, 3×(H3:5w + P:18w) |
| `icons-row-5` | Icon Row (5 items) | Canva | H2 + row | H2:8w, 5×(Icon + Label:4w) |
| `icons-grid-6` | Icon Grid (6 items) | Canva | H2 + 3×2 | H2:8w, 6×(Icon + Label:3w + P:10w) |
| `bullets-numbered-4` | Numbered Steps | Slidesgo | 100 stacked | H2:8w, 4×(Step# + H3:5w + P:18w) |
| `bullets-img-split` | Bullets + Image | Canva | 55/45 | H2:8w, 3×(H3:5w + P:12w), IMG |

### Category E — Charts & Data (remaining: 4)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `chart-full` | Chart Full-Width | PPT | 100 stacked | H2:8w, P:25w, Chart(4-6pts) |
| `chart-right-text-left` | Chart Right + Text | Slidesgo | 45text/55chart | H2:8w, P:40w, Chart |
| `chart-two-side` | Two Charts | Slidesgo | 50/50 | H2:8w, Chart-A, Chart-B |
| `chart-bullets-below` | Chart + Takeaways | Canva | 60/40 vert | H2:8w, Chart, 3×(Bullet:12w) |
| `key-stats-row` | Key Stats Row | Canva | H2 + 3-4 col | H2:8w, 4×(Number + Label:4w) |

### Category F — Tables (remaining: 3)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `table-full` | Table Full-Width | PPT | 100 stacked | H2:8w, P:20w, Table(3-4col × 4-5row) |
| `table-text-split` | Table + Text | Slidesgo | 55/45 | H2:6w, Table(3×4), P:35w |
| `table-image-split` | Table + Image | Slidesgo | 55/45 | H2:6w, Table(3×3), IMG |
| `table-comparison` | Feature Comparison | Canva | 100 stacked | H2:8w, Table(3-4col × 5-6row, ✓/✗) |

### Category G — Comparisons (remaining: 4)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `compare-three-way` | Three-Way Compare | Canva | 33/33/33 | H2:8w, 3×(H3:4w + 3×LI:6w) |
| `before-after` | Before / After | Slidesgo | 50/50 | H2:8w, 2×(H3:5w + P:30w) |
| `pros-cons` | Pros & Cons | Slidesgo | 50/50 | H2:8w, Pros(3×LI:10w), Cons(3×LI:10w) |
| `compare-img` | Compare + Image | Canva | 60/40 | H2:8w, 2×(H3:5w + 2×LI:8w), IMG |

### Category H — Processes & Diagrams (remaining: 6)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `timeline-vertical` | Timeline Vertical | Slidesgo | 100 stacked | H2:8w, P:15w, 4×(H3:5w + P:12w) |
| `process-vertical` | Vertical Step Flow | Canva | 100 stacked | H2:8w, 4×(Step# + H3:5w + P:15w) |
| `cycle-diagram` | Cycle Diagram | Slidesgo | H2 + circular | H2:8w, 4×(H3:4w + P:12w) |
| `funnel` | Funnel Diagram | Slidesgo | H2 + funnel | H2:8w, 4×(H3:5w + P:12w) |
| `staircase` | Staircase | Slidesgo | H2 + steps | H2:8w, 4×(H3:5w + P:12w) |
| `roadmap` | Roadmap | Slidesgo | H2 + lane | H2:8w, 4×(H3:5w + P:12w) |

### Category I — Mixed & Complex (remaining: 4)

| ID | Name | Source | Grid | Slots |
|:---|:---|:---|:---|:---|
| `stats-paragraph` | Stats + Paragraph | Canva | 100 stacked | H2:8w, 3-4×(Number + Label:4w), P:30w |
| `bullets-chart-split` | Bullets + Chart | Slidesgo | 50/50 | H2:8w, 3×(H3:5w + P:12w), Chart(4pts) |
| `table-chart-split` | Table + Chart | Slidesgo | 50/50 | Table(3×3), Chart(4pts) |
| `timeline-image` | Timeline + Image | Slidesgo | 60/40 | H2:8w, 3×(H3:4w + P:12w), IMG |
| `infographic-mixed` | Full Infographic | Canva | Complex | H2:8w, 2×(Stat), 2×(H3:5w + P:10w), Callout:12w |

---

## 6. TypeScript & Zod Implementation

### Core Types

```typescript
import { z } from "zod";

// ── Orchestration Schema (Phase 1 output) ──────────────────────

export const SlideBlueprint = z.object({
  slideNumber: z.number().int().min(1),
  templateId: z.string(),
  creativeBrief: z.string().max(200),
  layoutPercentages: z.array(z.number().min(10).max(90)).optional(), // Draggable grid partitions
});

export const DeckOrchestrationResult = z.object({
  slides: z.array(SlideBlueprint),
});

export type SlideBlueprint = z.infer<typeof SlideBlueprint>;
export type DeckOrchestrationResult = z.infer<typeof DeckOrchestrationResult>;

// ── Slot Schemas (Phase 2 building blocks) ─────────────────────

export const HeadingSlot = z.object({
  slotId: z.string(),
  type: z.literal("heading"),
  text: z.string().max(80), // ~10 words
});

export const ParagraphSlot = z.object({
  slotId: z.string(),
  type: z.literal("paragraph"),
  text: z.string().max(350), // ~50 words
});

export const CalloutSlot = z.object({
  slotId: z.string(),
  type: z.literal("callout"),
  text: z.string().max(120), // ~20 words
});

export const QuoteSlot = z.object({
  slotId: z.string(),
  type: z.literal("quote"),
  text: z.string().max(200), // ~30 words
  attribution: z.string().max(60).optional(),
});

export const ImageSlot = z.object({
  slotId: z.string(),
  type: z.literal("image"),
  query: z.string().min(10).max(150),
});

export const StatNumberSlot = z.object({
  slotId: z.string(),
  type: z.literal("stat-number"),
  value: z.string().max(10), // "40%", "$2.1M"
  label: z.string().max(40), // ~6 words
});

export const BulletItemSchema = z.object({
  title: z.string().max(40), // ~5 words
  description: z.string().max(120), // ~20 words
  icon: z.string().optional(),
});

export const BulletsSlot = z.object({
  slotId: z.string(),
  type: z.literal("bullets"),
  items: z.array(BulletItemSchema).min(2).max(6),
});

export const ListItemSchema = z.object({
  text: z.string().max(60), // ~8 words
});

export const CompareSlot = z.object({
  slotId: z.string(),
  type: z.literal("compare"),
  sides: z.array(
    z.object({
      title: z.string().max(40),
      items: z.array(ListItemSchema).min(2).max(4),
    })
  ).min(2).max(3),
});

export const ChartDataPoint = z.object({
  label: z.string().max(20),
  value: z.number(),
});

export const ChartSlot = z.object({
  slotId: z.string(),
  type: z.literal("chart"),
  chartType: z.enum(["bar", "line", "pie", "area", "radar"]),
  data: z.array(ChartDataPoint).min(2).max(6),
});

export const TableSlot = z.object({
  slotId: z.string(),
  type: z.literal("table"),
  headers: z.array(z.string().max(25)).min(2).max(4),
  rows: z.array(
    z.array(z.string().max(25)).min(2).max(4)
  ).min(2).max(5),
});

export const TimelineItemSchema = z.object({
  title: z.string().max(40),
  description: z.string().max(100),
});

export const TimelineSlot = z.object({
  slotId: z.string(),
  type: z.enum(["timeline", "cycle", "arrows", "funnel", "roadmap", "pyramid", "staircase", "process"]),
  items: z.array(TimelineItemSchema).min(2).max(4),
});

export const SwotSlot = z.object({
  slotId: z.string(),
  type: z.literal("swot"),
  quadrants: z.array(
    z.object({
      label: z.string().max(15),
      items: z.array(z.string().max(60)).min(2).max(3),
    })
  ).length(4),
});

// ── Union of all slot types ────────────────────────────────────

export const AnySlotContent = z.discriminatedUnion("type", [
  HeadingSlot,
  ParagraphSlot,
  CalloutSlot,
  QuoteSlot,
  ImageSlot,
  StatNumberSlot,
  BulletsSlot,
  CompareSlot,
  ChartSlot,
  TableSlot,
  TimelineSlot,
  SwotSlot,
]);

export type AnySlotContent = z.infer<typeof AnySlotContent>;

// ── Generated Slide (Phase 2 output) ───────────────────────────

export const GeneratedSlideContent = z.object({
  templateId: z.string(),
  slots: z.array(AnySlotContent),
});

export type GeneratedSlideContent = z.infer<typeof GeneratedSlideContent>;
```

### Per-Template Schema Factory

Each template gets a specific schema that defines exactly which slots it expects. This is passed to the LLM as the Structured Output schema.

```typescript
export function getSchemaForTemplate(templateId: string): z.ZodSchema {
  switch (templateId) {
    case "title-hero":
      return z.object({
        templateId: z.literal("title-hero"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("title") }),
          ParagraphSlot.extend({ slotId: z.literal("subtitle"), text: z.string().max(140) }),
          ImageSlot.extend({ slotId: z.literal("background") }),
        ]),
      });

    case "img-split-left":
      return z.object({
        templateId: z.literal("img-split-left"),
        slots: z.tuple([
          ImageSlot.extend({ slotId: z.literal("image") }),
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          ParagraphSlot.extend({ slotId: z.literal("body") }),
        ]),
      });

    case "big-number":
      return z.object({
        templateId: z.literal("big-number"),
        slots: z.tuple([
          StatNumberSlot.extend({ slotId: z.literal("stat") }),
          ParagraphSlot.extend({ slotId: z.literal("context"), text: z.string().max(180) }),
        ]),
      });

    case "chart-bar-side":
      return z.object({
        templateId: z.literal("chart-bar-side"),
        slots: z.tuple([
          ChartSlot.extend({ slotId: z.literal("chart") }),
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          ParagraphSlot.extend({ slotId: z.literal("insight") }),
          CalloutSlot.extend({ slotId: z.literal("callout") }),
        ]),
      });

    case "bullets-grid-4":
      return z.object({
        templateId: z.literal("bullets-grid-4"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          BulletsSlot.extend({
            slotId: z.literal("bullets"),
            items: z.array(BulletItemSchema).length(4),
          }),
        ]),
      });

    case "timeline-horizontal":
      return z.object({
        templateId: z.literal("timeline-horizontal"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          TimelineSlot.extend({
            slotId: z.literal("timeline"),
            type: z.literal("timeline"),
            items: z.array(TimelineItemSchema).min(3).max(4),
          }),
        ]),
      });

    case "compare-vs":
      return z.object({
        templateId: z.literal("compare-vs"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          CompareSlot.extend({
            slotId: z.literal("comparison"),
            sides: z.array(
              z.object({
                title: z.string().max(40),
                items: z.array(ListItemSchema).length(3),
              })
            ).length(2),
          }),
        ]),
      });

    case "process-arrows":
      return z.object({
        templateId: z.literal("process-arrows"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          TimelineSlot.extend({
            slotId: z.literal("steps"),
            type: z.literal("arrows"),
            items: z.array(TimelineItemSchema).length(3),
          }),
        ]),
      });

    case "table-insight":
      return z.object({
        templateId: z.literal("table-insight"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          TableSlot.extend({
            slotId: z.literal("table"),
            headers: z.array(z.string().max(25)).length(3),
            rows: z.array(z.array(z.string().max(25)).length(3)).min(3).max(4),
          }),
          CalloutSlot.extend({ slotId: z.literal("takeaway") }),
        ]),
      });

    case "text-three-column":
      return z.object({
        templateId: z.literal("text-three-column"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          BulletsSlot.extend({
            slotId: z.literal("columns"),
            items: z.array(BulletItemSchema.extend({
              description: z.string().max(180),
            })).length(3),
          }),
        ]),
      });

    case "quote-spotlight":
      return z.object({
        templateId: z.literal("quote-spotlight"),
        slots: z.tuple([
          QuoteSlot.extend({ slotId: z.literal("quote") }),
          ImageSlot.extend({ slotId: z.literal("background") }).optional(),
        ]),
      });

    case "img-bottom-text-top":
      return z.object({
        templateId: z.literal("img-bottom-text-top"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          ParagraphSlot.extend({ slotId: z.literal("body") }),
          ImageSlot.extend({ slotId: z.literal("image") }),
        ]),
      });

    case "swot-analysis":
      return z.object({
        templateId: z.literal("swot-analysis"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          SwotSlot.extend({ slotId: z.literal("swot") }),
        ]),
      });

    case "pyramid-3":
      return z.object({
        templateId: z.literal("pyramid-3"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading") }),
          TimelineSlot.extend({
            slotId: z.literal("levels"),
            type: z.literal("pyramid"),
            items: z.array(TimelineItemSchema).length(3),
          }),
        ]),
      });

    case "closing-cta":
      return z.object({
        templateId: z.literal("closing-cta"),
        slots: z.tuple([
          HeadingSlot.extend({ slotId: z.literal("heading"), text: z.string().max(50) }),
          ParagraphSlot.extend({ slotId: z.literal("cta"), text: z.string().max(100) }),
        ]),
      });

    default:
      throw new Error(`Unknown template: ${templateId}`);
  }
}
```

---

## 6.5 Draggable Columns Architecture (Shadcn `resizable-panel-group` Integration)

To give the user Gamma-level visual control, we integrate Shadcn's `resizable-panel-group` inside our multi-column slide templates. This lets the user dynamically adjust column widths while staying strictly locked within the overall 16:9 presentation bounds.

### 1. Editor Layout Integration

For templates supporting horizontal resizing (e.g., `img-split-left`, `compare-vs`, `chart-bar-side`, `text-two-column`), we replace static CSS grids in the editor with:
- `<ResizablePanelGroup direction="horizontal">`
- `<ResizablePanel>` for left slot/content
- `<ResizableHandle>` for the draggable splitter
- `<ResizablePanel>` for right slot/content

```tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export function ResizableSlideLayout({
  slideIndex,
  layoutPercentages = [50, 50],
  leftContent,
  rightContent,
}: {
  slideIndex: number;
  layoutPercentages?: number[];
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}) {
  const updateSlidePercentages = usePresentationState((s) => s.updateSlidePercentages);

  const handleResize = (sizes: number[]) => {
    // Debounced update to slide layout percentages in global state
    updateSlidePercentages(slideIndex, sizes);
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={handleResize}
      className="h-full w-full"
    >
      <ResizablePanel defaultSize={layoutPercentages[0] ?? 50} minSize={20}>
        <div className="h-full w-full p-4 flex flex-col justify-center">
          {leftContent}
        </div>
      </ResizablePanel>
      
      <ResizableHandle className="w-1 bg-accent/20 hover:bg-primary transition-colors cursor-col-resize" />
      
      <ResizablePanel defaultSize={layoutPercentages[1] ?? 50} minSize={20}>
        <div className="h-full w-full p-4 flex flex-col justify-center">
          {rightContent}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

### 2. State Integration in `usePresentationState`

We add a method to our Zustand store to handle slide-specific dimension updates:

```typescript
interface PresentationState {
  slides: PlateSlide[];
  setSlides: (slides: PlateSlide[]) => void;
  updateSlidePercentages: (slideIndex: number, percentages: number[]) => void;
}

// In the store declaration:
updateSlidePercentages: (slideIndex, percentages) => {
  set((state) => {
    const updated = [...state.slides];
    if (updated[slideIndex]) {
      updated[slideIndex] = {
        ...updated[slideIndex],
        layoutPercentages: percentages,
      };
    }
    return { slides: updated };
  });
}
```

### 3. Rendering Mode Differences (Edit vs. Present/Print)

* **Editor Mode:** Full interactivity. `<ResizableHandle>` is visible and draggable.
* **Present/Print/PPTX Export Mode:** Read-only mode. We utilize standard CSS percentage widths derived from the saved `layoutPercentages` state (or `<ResizablePanelGroup>` in a disabled/read-only state) so the exact proportions are locked and rendered without handles.

---

## 7. CSS Grid & Styling Strategy

### Delete

All `@container slide` hacks in `styles/presentation.css`:
- Every `:has(table)`, `:has(.grid-cols-3)`, `:has(.group\/bullet-item)` rule
- Emergency `font-size` overrides for split layouts
- Manual padding calculations (`4.5cqw`, `6.25cqw`)
- ~400 lines total

### Keep

- `container-type: inline-size` on `.slide-container-aspect`
- Theme variable definitions (`:root`, `[data-theme="dark"]`)
- Slide border/shadow styling
- Presentation/fullscreen mode styles
- Print styles

### Add: Template Grid Classes

Each template gets exactly one CSS class defining its grid. Clean, predictable, no hacks.

```css
/* ── Title Hero ─────────────────────────────── */
.template-title-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 6cqw;
}

/* ── Image Left + Text Right (50/50 split) ──── */
.template-img-split-left {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4cqw;
  height: 100%;
  align-items: center;
  padding: 4cqw;
}

.template-img-split-left .slot-image {
  height: 100%;
  border-radius: 1.2cqw;
  object-fit: cover;
}

/* ── Big Number ─────────────────────────────── */
.template-big-number {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  gap: 2cqw;
}

.template-big-number .slot-stat-value {
  font-size: 12cqw;
  font-weight: 800;
  line-height: 1;
}

/* ── 4-Bullet Grid (2×2) ───────────────────── */
.template-bullets-grid-4 {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 4cqw;
  gap: 2cqw;
}

.template-bullets-grid-4 .slot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2cqw;
}

/* ── Chart + Text Split (50/50) ─────────────── */
.template-chart-bar-side {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3cqw;
  height: 100%;
  align-items: center;
  padding: 4cqw;
}

/* ── Timeline Horizontal ────────────────────── */
.template-timeline-horizontal {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 4cqw;
  gap: 2cqw;
}

.template-timeline-horizontal .slot-timeline-row {
  display: flex;
  gap: 2cqw;
  align-items: flex-start;
}

/* ── VS Comparison (50/50 with divider) ─────── */
.template-compare-vs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 4cqw;
  gap: 2cqw;
}

.template-compare-vs .slot-divider {
  width: 2px;
  height: 100%;
  background: var(--presentation-accent);
  opacity: 0.3;
}

/* ── Process Arrows ─────────────────────────── */
.template-process-arrows {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 4cqw;
  gap: 2cqw;
}

.template-process-arrows .slot-arrow-row {
  display: flex;
  gap: 1.5cqw;
  align-items: stretch;
}

/* ── Table + Insight ────────────────────────── */
.template-table-insight {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  padding: 4cqw;
  gap: 2cqw;
}

/* ── Three-Column Text ──────────────────────── */
.template-text-three-column {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 4cqw;
  gap: 2cqw;
}

.template-text-three-column .slot-columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 3cqw;
}

/* ── Image Bottom, Text Top ─────────────────── */
.template-img-bottom-text-top {
  display: grid;
  grid-template-rows: 2fr 3fr;
  height: 100%;
  padding: 4cqw 4cqw 0;
  gap: 2cqw;
}

.template-img-bottom-text-top .slot-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1.2cqw 1.2cqw 0 0;
}

/* ── Quote Spotlight ────────────────────────── */
.template-quote-spotlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 8cqw;
}

.template-quote-spotlight .slot-quote-text {
  font-size: 3.5cqw;
  font-style: italic;
  line-height: 1.4;
  max-width: 80%;
}

/* ── SWOT Analysis (2×2) ────────────────────── */
.template-swot-analysis {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 4cqw;
  gap: 1.5cqw;
}

.template-swot-analysis .slot-swot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1.5cqw;
}

/* ── Pyramid (3 levels) ─────────────────────── */
.template-pyramid-3 {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 4cqw;
  gap: 2cqw;
}

/* ── Closing CTA ────────────────────────────── */
.template-closing-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 6cqw;
  gap: 3cqw;
}

/* ── Base Typography (replaces all cqw hacks) ─ */
.slide-container-aspect .presentation-slide {
  font-size: clamp(0.75rem, 1.5cqw, 1.5rem);
}

.slide-container-aspect .presentation-slide h1 {
  font-size: clamp(1.5rem, 4cqw, 3.5rem);
  font-weight: 800;
}

.slide-container-aspect .presentation-slide h2 {
  font-size: clamp(1.25rem, 3cqw, 2.5rem);
  font-weight: 700;
}

.slide-container-aspect .presentation-slide h3 {
  font-size: clamp(1rem, 2cqw, 1.75rem);
  font-weight: 600;
}
```

---

## 8. File Changes Map

### New Files

| File | Purpose |
|:---|:---|
| `lib/presentation/layout-templates.ts` | Core 15 templates as typed LayoutTemplate objects + `getSchemaForTemplate()` |
| `lib/presentation/slot-validator.ts` | `truncateToWordBudget()` + per-slot validation |
| `lib/presentation/deck-orchestrator.ts` | Phase 1 orchestration call — outline → slide blueprint array |
| `app/(export)/presentation-export/page.tsx` | Dedicated high-fidelity headless viewport route locked to strict `1280x720` print boundary |
| `docs/presentation-architecture.md` | This document |

### Modified Files

| File | Changes |
|:---|:---|
| `lib/presentation/generate-slide.ts` | Phase 2 slot filling with Zod Structured Outputs |
| `lib/presentation/generate-prompts.ts` | New orchestration prompt + slot filling prompt builders |
| `lib/presentation/layout-recipes.ts` | Replace `getLayoutForSlide()` → template selection via orchestrator |
| `lib/presentation/slide-validator.ts` | Replace "has rich component" → run truncation on all slots |
| `app/api/presentation/generate/route.ts` | Two-phase pipeline + `Promise.all()` parallel execution |
| `states/presentation-state.ts` | Add `layoutPercentages` state and `updateSlidePercentages()` action |
| `components/presentation/editor/presentation-editor.tsx` | Wrap multi-column layouts in interactive ResizablePanelGroup |
| `styles/presentation.css` | Delete ~400 lines of hacks, add 15 template grid classes + clamp typography, map custom theme variables bridge |
| `components/presentation/editor/custom-elements/bar-graph.tsx` | Bind fill properties directly to theme variable: `fill: var(--graph-0)` |
| `components/presentation/editor/custom-elements/line-graph.tsx` | Bind stroke properties directly to theme variable: `stroke: var(--stroke)` |
| `components/presentation/editor/custom-elements/pie-chart.tsx` | Bind slice fills directly to theme variables: `var(--graph-0)`, `var(--graph-1)` |
| `components/presentation/editor/custom-elements/area-chart.tsx` | Bind area fills directly to theme variables: `var(--graph-0)` |

---

## 9. Implementation Order

| Phase | What | Est. |
|:---|:---|:---|
| **1** | Deck Orchestrator API — Phase 1 call, test with dummy outlines | Day 1 |
| **2** | Schema Engine — Zod schemas for Core 15 templates + `getSchemaForTemplate()` | Day 1-2 |
| **3** | Parallel Generator — Phase 2 `Promise.all()` with Structured Outputs | Day 2-3 |
| **4** | The Guillotine — `truncateToWordBudget()` utility, runs on all slots | Day 3 |
| **5** | Frontend CSS — Delete 400 lines of legacy hacks, build 15 clean CSS grids | Day 3-4 |
| **6** | Scoped Theme variable bridge — Set raw theme variables at container scopes and remove ad-hoc styles | Day 4 |
| **7** | Chart Color Fix — Theme-aware CSS strokes and fills across all chart components | Day 4 |
| **8** | Draggable Splits coordinate preservation inside Zustand store schema | Day 4-5 |
| **9** | Dedicated high-fidelity headless export viewport (`/presentation-export`) | Day 5 |
| **10** | E2E Testing — Generate 10-slide deck, verify < 15s latency, zero overflow, verify high-fidelity PDF prints | Day 5 |

---

## 10. Verification Plan

### Performance
- 10-slide deck generates in < 15 seconds (down from 60s+)
- Phase 1 orchestration completes in < 3 seconds
- Phase 2 parallel calls complete in < 12 seconds

### Correctness
- Every slide's content stays within the 16:9 boundary at all zoom levels
- Slot validator reports 0 budget violations after The Guillotine
- `pnpm type` — 0 errors
- `pnpm check` — 0 warnings

### Visual Quality
- Same topic generated → compare old system vs new template system
- PPTX export matches editor view exactly
- Chart colors visible on both light and dark themes
- Present mode works at 1080p, 1440p, 4K

### Regression
- Existing presentations in DB still render correctly
- Theme switching still works
- Drag-and-drop slide reordering still works
- Image generation/upload still works
