import { type PlateNode } from "./parser";

export type Rect = { x: number; y: number; w: number; h: number };

export type MeasuredBlock = {
  node: PlateNode;
  h: number; // measured height in inches
};

export type Frame = {
  node: PlateNode;
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Simple vertical flow layout: measure → pack within bounds → return frames.
 * - measure(el, width) must return height in inches for the given width
 * - never place a frame beyond area bottom; last frame is clamped to remaining height
 */
export async function layoutVerticalFlow(
  nodes: PlateNode[],
  area: Rect,
  measure: (node: PlateNode, width: number) => Promise<number> | number,
): Promise<Frame[]> {
  const frames: Frame[] = [];
  let cursorY = area.y;
  const bottom = area.y + area.h;

  for (const node of nodes) {
    const measured = await measure(node, area.w);
    const h = Math.max(0, measured);
    if (h <= 0) continue;
    if (cursorY >= bottom) break;

    let frameH = h;
    if (cursorY + frameH > bottom) {
      frameH = Math.max(0.4, bottom - cursorY); // clamp to remaining space
    }

    frames.push({ node, x: area.x, y: cursorY, w: area.w, h: frameH });
    cursorY += frameH; // no extra gap; renderer can include padding inside blocks
  }

  return frames;
}


