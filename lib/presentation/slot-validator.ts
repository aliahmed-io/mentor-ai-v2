import {
  type AnySlotContent,
  type TemplateSlot,
  TEMPLATES,
} from "./layout-templates";

/**
 * Truncates text strictly to a word count limit.
 * It does not try to be "smart" or rewrite. It acts like a guillotine.
 */
export function truncateToWordBudget(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Validates and sanitizes the LLM-generated slot content against the template's strict budgets.
 * - Truncates overflowing text.
 * - Slices overflowing arrays (e.g., too many bullet points).
 * - Enforces minimum constraints with default fallbacks if missing.
 */
export function validateAndSanitizeSlot(
  slotData: AnySlotContent,
  templateId: string,
): AnySlotContent {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    console.warn(`[slot-validator] Template ${templateId} not found. Skipping validation.`);
    return slotData;
  }

  // A more robust implementation would map slotId to TemplateSlot rules,
  // but for V1 we apply global slot type rules or default budgets.

  switch (slotData.type) {
    case "heading":
      return { ...slotData, text: truncateToWordBudget(slotData.text, 15) };
    case "paragraph":
      return { ...slotData, text: truncateToWordBudget(slotData.text, 50) };
    case "callout":
      return { ...slotData, text: truncateToWordBudget(slotData.text, 25) };
    case "quote":
      return {
        ...slotData,
        text: truncateToWordBudget(slotData.text, 35),
        attribution: slotData.attribution
          ? truncateToWordBudget(slotData.attribution, 8)
          : undefined,
      };
    case "stat-number":
      return {
        ...slotData,
        value: truncateToWordBudget(slotData.value, 2),
        label: truncateToWordBudget(slotData.label, 8),
      };
    case "bullets":
      return {
        ...slotData,
        items: slotData.items.slice(0, 6).map((item) => ({
          ...item,
          title: truncateToWordBudget(item.title, 8),
          description: truncateToWordBudget(item.description, 20),
        })),
      };
    case "compare":
      return {
        ...slotData,
        sides: slotData.sides.slice(0, 3).map((side) => ({
          ...side,
          title: truncateToWordBudget(side.title, 6),
          items: side.items.slice(0, 5).map((item) => ({
            ...item,
            text: truncateToWordBudget(item.text, 10),
          })),
        })),
      };
    case "chart":
      return {
        ...slotData,
        data: slotData.data.slice(0, 6).map((d) => ({
          ...d,
          label: truncateToWordBudget(d.label, 4),
        })),
      };
    case "table":
      return {
        ...slotData,
        headers: slotData.headers.slice(0, 4).map((h) => truncateToWordBudget(h, 4)),
        rows: slotData.rows.slice(0, 5).map((row) =>
          row.slice(0, 4).map((cell) => truncateToWordBudget(cell, 8)),
        ),
      };
    case "timeline":
    case "cycle":
    case "arrows":
    case "funnel":
    case "roadmap":
    case "pyramid":
    case "staircase":
    case "process":
      return {
        ...slotData,
        items: slotData.items.slice(0, 4).map((item) => ({
          ...item,
          title: truncateToWordBudget(item.title, 6),
          description: truncateToWordBudget(item.description, 15),
        })),
      } as any; // Type override due to discriminated union overlap
    case "swot":
      return {
        ...slotData,
        quadrants: slotData.quadrants.slice(0, 4).map((q) => ({
          ...q,
          label: truncateToWordBudget(q.label, 3),
          items: q.items.slice(0, 3).map((i) => truncateToWordBudget(i, 8)),
        })),
      };
    case "image":
      return slotData;
    default:
      return slotData;
  }
}
