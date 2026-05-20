import type { PlateNode, PlateSlide } from "@/components/presentation/utils/parser";
import type { RichComponent } from "./layout-recipes";
import { RICH_XML_TAGS, slideXmlHasRichComponent } from "./xml-component-examples";

const RICH_PLATE_TYPES = new Set([
  "bullets",
  "icons",
  "table",
  "timeline",
  "cycle",
  "compare",
  "column_group",
  "boxes",
  "before-after",
  "pros-cons",
  "pyramid",
  "staircase",
  "arrows",
  "arrow-vertical",
  "chart-bar",
  "chart-pie",
  "chart-line",
  "chart-area",
  "chart-radar",
  "chart-scatter",
  "visualization-list",
]);

function walkNodes(nodes: PlateNode[], found: Set<string>): void {
  for (const node of nodes) {
    if (node.type && RICH_PLATE_TYPES.has(node.type as string)) {
      found.add(node.type as string);
    }
    if (node.children && Array.isArray(node.children)) {
      walkNodes(node.children as PlateNode[], found);
    }
  }
}

export function hasRichComponent(content: PlateNode[]): boolean {
  const found = new Set<string>();
  walkNodes(content, found);
  return found.size > 0;
}

export function getSlideRichnessScore(slide: PlateSlide): number {
  const found = new Set<string>();
  walkNodes(slide.content, found);
  let score = found.size;
  if (slide.rootImage?.query) score += 0.5;
  const hasHeading = slide.content.some((n) =>
    ["h1", "h2", "h3"].includes(n.type as string),
  );
  if (hasHeading) score += 0.5;
  return score;
}

export function validateSlideContent(
  slide: PlateSlide,
  requiredComponent?: RichComponent,
): { valid: boolean; reason?: string } {
  if (!hasRichComponent(slide.content)) {
    return {
      valid: false,
      reason: "Slide is missing a rich layout component (bullets, chart, table, icons, etc.)",
    };
  }
  if (requiredComponent) {
    const xmlTag = requiredComponent;
    const typeMap: Partial<Record<RichComponent, string[]>> = {
      CHART: [
        "chart-bar",
        "chart-pie",
        "chart-line",
        "chart-area",
        "chart-radar",
        "chart-scatter",
      ],
      TABLE: ["table"],
      BULLETS: ["bullets"],
      ICONS: ["icons"],
      TIMELINE: ["timeline"],
      CYCLE: ["cycle"],
      COMPARE: ["compare"],
      COLUMNS: ["column_group"],
      BOXES: ["boxes"],
      "BEFORE-AFTER": ["before-after"],
      "PROS-CONS": ["pros-cons"],
      PYRAMID: ["pyramid"],
      STAIRCASE: ["staircase"],
      ARROWS: ["arrows"],
      "ARROW-VERTICAL": ["arrow-vertical"],
    };
    const expected = typeMap[requiredComponent] ?? [];
    const found = new Set<string>();
    walkNodes(slide.content, found);
    const hasRequired = expected.some((t) => found.has(t));
    if (!hasRequired) {
      return {
        valid: false,
        reason: `Slide must include <${xmlTag}> component`,
      };
    }
  }
  return { valid: true };
}

export function validateSlideXml(
  xml: string,
  requiredComponent?: RichComponent,
): { valid: boolean; reason?: string } {
  if (!xml.includes("<SECTION")) {
    return { valid: false, reason: "Missing SECTION wrapper" };
  }
  if (!slideXmlHasRichComponent(xml, requiredComponent)) {
    const tag = requiredComponent ?? "rich component";
    return {
      valid: false,
      reason: `XML missing required <${tag}> block`,
    };
  }
  if (!xml.includes("<IMG")) {
    return { valid: false, reason: "Missing IMG tag with query" };
  }
  return { valid: true };
}

export { RICH_XML_TAGS, RICH_PLATE_TYPES };
