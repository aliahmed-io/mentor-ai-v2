import { z } from "zod";

// ── Orchestration Schema (Phase 1 output) ──────────────────────

export const SlideBlueprint = z.object({
  slideNumber: z.number().int().min(1),
  templateId: z.string(),
  creativeBrief: z.string(),
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
  text: z.string(), // ~10 words
});

export const ParagraphSlot = z.object({
  slotId: z.string(),
  type: z.literal("paragraph"),
  text: z.string(), // ~50 words
});

export const CalloutSlot = z.object({
  slotId: z.string(),
  type: z.literal("callout"),
  text: z.string(), // ~20 words
});

export const QuoteSlot = z.object({
  slotId: z.string(),
  type: z.literal("quote"),
  text: z.string(), // ~30 words
  attribution: z.string().optional(),
});

export const ImageSlot = z.object({
  slotId: z.string(),
  type: z.literal("image"),
  query: z.string(),
});

export const StatNumberSlot = z.object({
  slotId: z.string(),
  type: z.literal("stat-number"),
  value: z.string(), // "40%", "$2.1M"
  label: z.string(), // ~6 words
});

export const BulletItemSchema = z.object({
  title: z.string(), // ~5 words
  description: z.string(), // ~20 words
  icon: z.string().optional(),
});

export const BulletsSlot = z.object({
  slotId: z.string(),
  type: z.literal("bullets"),
  items: z.array(BulletItemSchema).min(2).max(6),
});

export const ListItemSchema = z.object({
  text: z.string(), // ~8 words
});

export const CompareSlot = z.object({
  slotId: z.string(),
  type: z.literal("compare"),
  sides: z.array(
    z.object({
      title: z.string(),
      items: z.array(ListItemSchema).min(2).max(4),
    })
  ).min(2).max(3),
});

export const ChartDataPoint = z.object({
  label: z.string(),
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
  headers: z.array(z.string()).min(2).max(4),
  rows: z.array(
    z.array(z.string()).min(2).max(4)
  ).min(2).max(5),
});

export const TimelineItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const TimelineSlot = z.object({
  slotId: z.string(),
  type: z.enum(["timeline", "cycle", "arrows", "arrow-vertical", "funnel", "roadmap", "pyramid", "staircase", "process"]),
  items: z.array(TimelineItemSchema).min(2).max(4),
});

export const SwotSlot = z.object({
  slotId: z.string(),
  type: z.literal("swot"),
  quadrants: z.array(
    z.object({
      label: z.string(),
      items: z.array(z.string()).min(2).max(3),
    })
  ).length(4),
});

export const IconsSlot = z.object({
  slotId: z.string(),
  type: z.literal("icons"),
  items: z.array(BulletItemSchema).min(2).max(6),
});

export const BoxesSlot = z.object({
  slotId: z.string(),
  type: z.literal("boxes"),
  items: z.array(BulletItemSchema).min(2).max(6),
});

export const BeforeAfterSlot = z.object({
  slotId: z.string(),
  type: z.literal("before-after"),
  sides: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
    })
  ).length(2),
});

export const ProsConsSlot = z.object({
  slotId: z.string(),
  type: z.literal("pros-cons"),
  sides: z.array(
    z.object({
      type: z.enum(["pros", "cons"]),
      title: z.string(),
      items: z.array(ListItemSchema).min(2).max(4),
    })
  ).length(2),
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
  IconsSlot,
  BoxesSlot,
  BeforeAfterSlot,
  ProsConsSlot,
]);

export type AnySlotContent = z.infer<typeof AnySlotContent>;

// ── Generated Slide (Phase 2 output) ───────────────────────────

export const GeneratedSlideContent = z.object({
  templateId: z.string(),
  slots: z.array(AnySlotContent),
});

export type GeneratedSlideContent = z.infer<typeof GeneratedSlideContent>;

// ── Template Schemas Factory ───────────────────────────────────

export function getSchemaForTemplate(templateId: string): z.ZodSchema {
  switch (templateId) {
    case "title-hero":
      return z.object({
        templateId: z.literal("title-hero"),
        slots: z.object({
          "title": HeadingSlot.extend({ slotId: z.literal("title") }),
          "subtitle": ParagraphSlot.extend({ slotId: z.literal("subtitle"), text: z.string() }),
          "background": ImageSlot.extend({ slotId: z.literal("background") })
        }),
      });

    case "img-split-left":
      return z.object({
        templateId: z.literal("img-split-left"),
        slots: z.object({
          "image": ImageSlot.extend({ slotId: z.literal("image") }),
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "body": ParagraphSlot.extend({ slotId: z.literal("body") })
        }),
      });

    case "big-number":
      return z.object({
        templateId: z.literal("big-number"),
        slots: z.object({
          "stat": StatNumberSlot.extend({ slotId: z.literal("stat") }),
          "context": ParagraphSlot.extend({ slotId: z.literal("context"), text: z.string() })
        }),
      });

    case "chart-bar-side":
      return z.object({
        templateId: z.literal("chart-bar-side"),
        slots: z.object({
          "chart": ChartSlot.extend({ slotId: z.literal("chart") }),
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "insight": ParagraphSlot.extend({ slotId: z.literal("insight") }),
          "callout": CalloutSlot.extend({ slotId: z.literal("callout") })
        }),
      });

    case "bullets-grid-4":
      return z.object({
        templateId: z.literal("bullets-grid-4"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "bullets": BulletsSlot.extend({
            slotId: z.literal("bullets"),
            items: z.array(BulletItemSchema).length(4),
          })
        }),
      });

    case "timeline-horizontal":
      return z.object({
        templateId: z.literal("timeline-horizontal"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "timeline": TimelineSlot.extend({
            slotId: z.literal("timeline"),
            type: z.literal("timeline"),
            items: z.array(TimelineItemSchema).min(3).max(4),
          })
        }),
      });

    case "compare-vs":
      return z.object({
        templateId: z.literal("compare-vs"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "comparison": CompareSlot.extend({
            slotId: z.literal("comparison"),
            sides: z.array(
              z.object({
                title: z.string(),
                items: z.array(ListItemSchema).length(3),
              })
            ).length(2),
          })
        }),
      });

    case "process-arrows":
      return z.object({
        templateId: z.literal("process-arrows"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "steps": TimelineSlot.extend({
            slotId: z.literal("steps"),
            type: z.literal("arrows"),
            items: z.array(TimelineItemSchema).length(3),
          })
        }),
      });

    case "table-insight":
      return z.object({
        templateId: z.literal("table-insight"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "table": TableSlot.extend({
            slotId: z.literal("table"),
            headers: z.array(z.string()).length(3),
            rows: z.array(z.array(z.string()).length(3)).min(3).max(4),
          }),
          "takeaway": CalloutSlot.extend({ slotId: z.literal("takeaway") })
        }),
      });

    case "text-three-column":
      return z.object({
        templateId: z.literal("text-three-column"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "columns": BulletsSlot.extend({
            slotId: z.literal("columns"),
            items: z.array(BulletItemSchema.extend({
              description: z.string(),
            })).length(3),
          })
        }),
      });
      
    case "quote-spotlight":
      return z.object({
        templateId: z.literal("quote-spotlight"),
        slots: z.object({
          "quote": QuoteSlot.extend({ slotId: z.literal("quote") })
        }),
      });

    case "img-bottom-text-top":
      return z.object({
        templateId: z.literal("img-bottom-text-top"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "body": ParagraphSlot.extend({ slotId: z.literal("body") }),
          "image": ImageSlot.extend({ slotId: z.literal("image") })
        }),
      });

    case "swot-analysis":
      return z.object({
        templateId: z.literal("swot-analysis"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "swot": SwotSlot.extend({ slotId: z.literal("swot") })
        }),
      });

    case "pyramid-3":
      return z.object({
        templateId: z.literal("pyramid-3"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "pyramid": TimelineSlot.extend({
            slotId: z.literal("pyramid"),
            type: z.literal("pyramid"),
            items: z.array(TimelineItemSchema).length(3),
          })
        }),
      });

    case "closing-cta":
      return z.object({
        templateId: z.literal("closing-cta"),
        slots: z.object({
          "heading": HeadingSlot.extend({ slotId: z.literal("heading") }),
          "contact": ParagraphSlot.extend({ slotId: z.literal("contact") })
        }),
      });

    default:
      // Fallback schema for unknown templates (should not happen in strictly typed execution)
      return z.object({
        templateId: z.string(),
        slots: z.array(AnySlotContent),
      });
  }
}

export interface TemplateSlot {
  id: string;
  type: "heading" | "paragraph" | "bullets" | "icons" | "chart" | "table"
      | "timeline" | "cycle" | "compare" | "before-after" | "pros-cons"
      | "pyramid" | "staircase" | "arrows" | "funnel" | "roadmap"
      | "image" | "callout" | "stat-number" | "swot";
  region: "full" | "left" | "right" | "top" | "bottom" | "center"
        | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  maxWords?: number;
  maxItems?: number;
  maxRows?: number;
  maxCols?: number;
  maxDataPoints?: number;
  maxWordsPerItem?: number;
  maxWordsPerCell?: number;
  headingLevel?: 1 | 2 | 3;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  category: string;
  source: string;
  description: string;
  gridCss: string;
  slots: TemplateSlot[];
  bestFor: string[];
  avoidAfter: string[];
}

export const TEMPLATES: LayoutTemplate[] = [
  {
    id: "title-hero",
    name: "Title Hero",
    category: "uncategorized",
    source: "Cinematic, centered, full bleed",
    description: "Layout for Title Hero",
    gridCss: "High-impact openings, section breaks",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 100 centered
    slots: []
  },
  {
    id: "img-split-left",
    name: "Image Left + Text",
    category: "uncategorized",
    source: "50/50 image left, text right",
    description: "Layout for Image Left + Text",
    gridCss: "Narrative storytelling, concept intros",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 50/50
    slots: []
  },
  {
    id: "quote-spotlight",
    name: "Quote Spotlight",
    category: "uncategorized",
    source: "Massive typography, deep background",
    description: "Layout for Quote Spotlight",
    gridCss: "Core truth emphasis, testimonials",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 100 centered
    slots: []
  },
  {
    id: "big-number",
    name: "Big Number",
    category: "uncategorized",
    source: "One giant metric, minimal text",
    description: "Layout for Big Number",
    gridCss: "Shocking statistics, ROI highlights",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 100 centered
    slots: []
  },
  {
    id: "bullets-grid-4",
    name: "4-Bullet Grid",
    category: "uncategorized",
    source: "2×2 modular grid with icons",
    description: "Layout for 4-Bullet Grid",
    gridCss: "Features, benefits, 4-point frameworks",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 2×2 grid
    slots: []
  },
  {
    id: "chart-bar-side",
    name: "Chart + Text Split",
    category: "uncategorized",
    source: "50% bar chart, 50% insight text",
    description: "Layout for Chart + Text Split",
    gridCss: "Financials, growth metrics",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 50/50
    slots: []
  },
  {
    id: "timeline-horizontal",
    name: "Timeline Horizontal",
    category: "uncategorized",
    source: "3-4 node horizontal sequence",
    description: "Layout for Timeline Horizontal",
    gridCss: "History, roadmaps, implementation plans",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2 + horiz bar
    slots: []
  },
  {
    id: "compare-vs",
    name: "VS Comparison",
    category: "uncategorized",
    source: "Split screen, vertical divider",
    description: "Layout for VS Comparison",
    gridCss: "Pros/Cons, Before/After, A vs B",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 50/50
    slots: []
  },
  {
    id: "process-arrows",
    name: "Arrow Flow",
    category: "uncategorized",
    source: "Chevron arrows left to right",
    description: "Layout for Arrow Flow",
    gridCss: "Step-by-step guides, user journeys",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2 + 3 arrows
    slots: []
  },
  {
    id: "table-insight",
    name: "Table + Insight",
    category: "uncategorized",
    source: "Clean 3×4 table + takeaway callout",
    description: "Layout for Table + Insight",
    gridCss: "Pricing, specs, feature matrices",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 100 stacked
    slots: []
  },
  {
    id: "text-three-column",
    name: "Three-Column Text",
    category: "uncategorized",
    source: "3 equal vertical columns",
    description: "Layout for Three-Column Text",
    gridCss: "Core pillars, principles, service tiers",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 33/33/33
    slots: []
  },
  {
    id: "img-bottom-text-top",
    name: "Text Top, Image Bottom",
    category: "uncategorized",
    source: "Text overhead, wide image anchoring",
    description: "Layout for Text Top, Image Bottom",
    gridCss: "Showcasing landscapes, dashboards",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 40text/60img vert
    slots: []
  },
  {
    id: "swot-analysis",
    name: "SWOT Analysis",
    category: "uncategorized",
    source: "2×2 grid specifically styled",
    description: "Layout for SWOT Analysis",
    gridCss: "Strategic planning, positioning",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 2×2 grid
    slots: []
  },
  {
    id: "pyramid-3",
    name: "Pyramid (3 levels)",
    category: "uncategorized",
    source: "Ascending triangle diagram",
    description: "Layout for Pyramid (3 levels)",
    gridCss: "Hierarchies, priorities, tech stacks",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2 + pyramid
    slots: []
  },
  {
    id: "closing-cta",
    name: "Closing CTA",
    category: "uncategorized",
    source: "Clean, high contrast, singular focus",
    description: "Layout for Closing CTA",
    gridCss: "Final ask, QR code, contact info",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: 100 centered
    slots: []
  },
  {
    id: "title-image-left",
    name: "Title + Image Left",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Title + Image Left",
    gridCss: "45img/55text",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: IMG, H1:10w, P:20w
    slots: []
  },
  {
    id: "title-image-right",
    name: "Title + Image Right",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Title + Image Right",
    gridCss: "55text/45img",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H1:10w, P:20w, IMG
    slots: []
  },
  {
    id: "section-header",
    name: "Section Header",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Section Header",
    gridCss: "100 centered",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:15w
    slots: []
  },
  {
    id: "section-image-bg",
    name: "Section + BG Image",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Section + BG Image",
    gridCss: "100 overlay",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: IMG(bg), H2:8w, P:12w
    slots: []
  },
  {
    id: "text-single-para",
    name: "Title + Paragraph",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Title + Paragraph",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:60w
    slots: []
  },
  {
    id: "text-two-para",
    name: "Title + Two Paragraphs",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Title + Two Paragraphs",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:40w, P:40w
    slots: []
  },
  {
    id: "text-caption-left",
    name: "Content + Caption Left",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Content + Caption Left",
    gridCss: "35/65",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H3:6w + P:30w, content
    slots: []
  },
  {
    id: "text-caption-right",
    name: "Content + Caption Right",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Content + Caption Right",
    gridCss: "65/35",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: content, H3:6w + P:30w
    slots: []
  },
  {
    id: "text-two-column",
    name: "Two-Column Text",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Two-Column Text",
    gridCss: "50/50",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 2×(H3:5w + P:35w)
    slots: []
  },
  {
    id: "img-right-text-left",
    name: "Image Right + Text",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Image Right + Text",
    gridCss: "55text/45img",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:50w, IMG
    slots: []
  },
  {
    id: "img-top-text-bottom",
    name: "Image Top + Text Bottom",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Image Top + Text Bottom",
    gridCss: "60img/40text vert",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: IMG, H2:8w, P:40w
    slots: []
  },
  {
    id: "img-left-bullets-right",
    name: "Image + Bullets Right",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Image + Bullets Right",
    gridCss: "40img/60text",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: IMG, H2:8w, 3×(H3:5w + P:12w)
    slots: []
  },
  {
    id: "img-right-bullets-left",
    name: "Image + Bullets Left",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Image + Bullets Left",
    gridCss: "60text/40img",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 3×(H3:5w + P:12w), IMG
    slots: []
  },
  {
    id: "img-two-col-text-center",
    name: "Two Images + Text",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Two Images + Text",
    gridCss: "30/40/30",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: IMG, H2:8w + P:35w, IMG
    slots: []
  },
  {
    id: "img-fullbleed-overlay",
    name: "Full Bleed + Overlay",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Full Bleed + Overlay",
    gridCss: "100 img bg",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: IMG, H2:8w overlay, P:20w overlay
    slots: []
  },
  {
    id: "bullets-3-horizontal",
    name: "3-Bullet Horizontal",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for 3-Bullet Horizontal",
    gridCss: "H2 + 3-col",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 3×(Icon + H3:5w + P:20w)
    slots: []
  },
  {
    id: "bullets-3-stack",
    name: "3-Bullet Stack",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for 3-Bullet Stack",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:20w, 3×(H3:5w + P:18w)
    slots: []
  },
  {
    id: "icons-row-5",
    name: "Icon Row (5 items)",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Icon Row (5 items)",
    gridCss: "H2 + row",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 5×(Icon + Label:4w)
    slots: []
  },
  {
    id: "icons-grid-6",
    name: "Icon Grid (6 items)",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Icon Grid (6 items)",
    gridCss: "H2 + 3×2",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 6×(Icon + Label:3w + P:10w)
    slots: []
  },
  {
    id: "bullets-numbered-4",
    name: "Numbered Steps",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Numbered Steps",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 4×(Step# + H3:5w + P:18w)
    slots: []
  },
  {
    id: "bullets-img-split",
    name: "Bullets + Image",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Bullets + Image",
    gridCss: "55/45",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 3×(H3:5w + P:12w), IMG
    slots: []
  },
  {
    id: "chart-full",
    name: "Chart Full-Width",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Chart Full-Width",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:25w, Chart(4-6pts)
    slots: []
  },
  {
    id: "chart-right-text-left",
    name: "Chart Right + Text",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Chart Right + Text",
    gridCss: "45text/55chart",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:40w, Chart
    slots: []
  },
  {
    id: "chart-two-side",
    name: "Two Charts",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Two Charts",
    gridCss: "50/50",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, Chart-A, Chart-B
    slots: []
  },
  {
    id: "chart-bullets-below",
    name: "Chart + Takeaways",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Chart + Takeaways",
    gridCss: "60/40 vert",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, Chart, 3×(Bullet:12w)
    slots: []
  },
  {
    id: "key-stats-row",
    name: "Key Stats Row",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Key Stats Row",
    gridCss: "H2 + 3-4 col",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 4×(Number + Label:4w)
    slots: []
  },
  {
    id: "table-full",
    name: "Table Full-Width",
    category: "uncategorized",
    source: "PPT",
    description: "Layout for Table Full-Width",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:20w, Table(3-4col × 4-5row)
    slots: []
  },
  {
    id: "table-text-split",
    name: "Table + Text",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Table + Text",
    gridCss: "55/45",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:6w, Table(3×4), P:35w
    slots: []
  },
  {
    id: "table-image-split",
    name: "Table + Image",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Table + Image",
    gridCss: "55/45",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:6w, Table(3×3), IMG
    slots: []
  },
  {
    id: "table-comparison",
    name: "Feature Comparison",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Feature Comparison",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, Table(3-4col × 5-6row, ✓/✗)
    slots: []
  },
  {
    id: "compare-three-way",
    name: "Three-Way Compare",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Three-Way Compare",
    gridCss: "33/33/33",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 3×(H3:4w + 3×LI:6w)
    slots: []
  },
  {
    id: "before-after",
    name: "Before / After",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Before / After",
    gridCss: "50/50",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 2×(H3:5w + P:30w)
    slots: []
  },
  {
    id: "pros-cons",
    name: "Pros & Cons",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Pros & Cons",
    gridCss: "50/50",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, Pros(3×LI:10w), Cons(3×LI:10w)
    slots: []
  },
  {
    id: "compare-img",
    name: "Compare + Image",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Compare + Image",
    gridCss: "60/40",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 2×(H3:5w + 2×LI:8w), IMG
    slots: []
  },
  {
    id: "timeline-vertical",
    name: "Timeline Vertical",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Timeline Vertical",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, P:15w, 4×(H3:5w + P:12w)
    slots: []
  },
  {
    id: "process-vertical",
    name: "Vertical Step Flow",
    category: "uncategorized",
    source: "Canva",
    description: "Layout for Vertical Step Flow",
    gridCss: "100 stacked",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 4×(Step# + H3:5w + P:15w)
    slots: []
  },
  {
    id: "cycle-diagram",
    name: "Cycle Diagram",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Cycle Diagram",
    gridCss: "H2 + circular",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 4×(H3:4w + P:12w)
    slots: []
  },
  {
    id: "funnel",
    name: "Funnel Diagram",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Funnel Diagram",
    gridCss: "H2 + funnel",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 4×(H3:5w + P:12w)
    slots: []
  },
  {
    id: "staircase",
    name: "Staircase",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Staircase",
    gridCss: "H2 + steps",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 4×(H3:5w + P:12w)
    slots: []
  },
  {
    id: "roadmap",
    name: "Roadmap",
    category: "uncategorized",
    source: "Slidesgo",
    description: "Layout for Roadmap",
    gridCss: "H2 + lane",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: H2:8w, 4×(H3:5w + P:12w)
    slots: []
  },
];
