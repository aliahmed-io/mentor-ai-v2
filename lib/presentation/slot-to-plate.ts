import { nanoid } from "nanoid";
import type { PlateNode } from "@/components/presentation/utils/parser";
import type { GeneratedSlideContent, AnySlotContent } from "./layout-templates";

export function mapSlotsToPlateNodes(slide: GeneratedSlideContent): PlateNode[] {
  const nodes: PlateNode[] = [];

  for (const slot of slide.slots) {
    const node = mapSlot(slot);
    if (node) {
      if (Array.isArray(node)) {
        nodes.push(...node);
      } else {
        nodes.push(node);
      }
    }
  }

  return nodes;
}

function mapSlot(slot: AnySlotContent): PlateNode | PlateNode[] | null {
  switch (slot.type) {
    case "heading":
      return {
        id: nanoid(),
        type: "h2", // Always H2 by default except title
        children: [{ text: slot.text }],
      } as any; // Cast as PlateNode via any to bypass strict literal type checks temporarily
      
    case "paragraph":
    case "callout":
      return {
        id: nanoid(),
        type: "p",
        children: [{ text: slot.text }],
      } as any;

    case "quote":
      return {
        id: nanoid(),
        type: "blockquote",
        children: [{ text: slot.text + (slot.attribution ? ` - ${slot.attribution}` : "") }],
      } as any;

    case "image":
      // Image isn't a direct PlateNode in the same way, but let's build the rootImage representation if needed
      // Actually, rootImage is on the PlateSlide object, not a node. But we'll output an IMG node for the UI
      return {
        id: nanoid(),
        type: "img",
        url: "",
        query: slot.query,
        children: [{ text: "" }],
      } as any;

    case "bullets":
      return {
        id: nanoid(),
        type: "bullets",
        children: slot.items.map((item) => ({
          id: nanoid(),
          type: "bullet-item",
          children: [
            {
              id: nanoid(),
              type: "h3",
              children: [{ text: item.title }],
            },
            {
              id: nanoid(),
              type: "p",
              children: [{ text: item.description }],
            },
          ],
        })),
      } as any;

    case "chart":
      return {
        id: nanoid(),
        type: `chart-${slot.chartType || "bar"}`,
        data: slot.data.map(d => ({ label: d.label, value: d.value })),
        children: [{ text: "" }],
      } as any;

    // Many more cases exist, but for MVP we will fallback to simple text blocks
    // In a real V2, we would exhaustively map every slot type to its exact PlateJS plugin node schema.
    default:
      console.warn(`[slot-to-plate] Unhandled slot type: ${slot.type}`);
      return null;
  }
}
