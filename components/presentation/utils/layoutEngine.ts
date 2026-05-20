import type { LayoutType, PlateNode, PlateSlide } from "./parser";

export type Rect = { x: number; y: number; w: number; h: number };

/** Shared 16:9 slide dimensions (inches) — used by PPTX export */
export const SLIDE_WIDTH_IN = 10;
export const SLIDE_HEIGHT_IN = 5.625;
export const SLIDE_MARGIN_IN = 0.5;
export const ROOT_IMAGE_WIDTH_RATIO = 0.45;
export const ROOT_IMAGE_VERTICAL_HEIGHT_RATIO = 0.4;

export type RootImageFrame = Rect & { layoutType?: LayoutType | string };

export function computeRootImageFrame(
  layoutType?: LayoutType | string,
): RootImageFrame {
  const full: RootImageFrame = {
    x: 0,
    y: 0,
    w: SLIDE_WIDTH_IN,
    h: SLIDE_HEIGHT_IN,
    layoutType,
  };
  switch (layoutType) {
    case "left":
      return { x: 0, y: 0, w: SLIDE_WIDTH_IN * ROOT_IMAGE_WIDTH_RATIO, h: SLIDE_HEIGHT_IN, layoutType };
    case "right":
      return {
        x: SLIDE_WIDTH_IN * (1 - ROOT_IMAGE_WIDTH_RATIO),
        y: 0,
        w: SLIDE_WIDTH_IN * ROOT_IMAGE_WIDTH_RATIO,
        h: SLIDE_HEIGHT_IN,
        layoutType,
      };
    case "vertical":
      return {
        x: 0,
        y: 0,
        w: SLIDE_WIDTH_IN,
        h: SLIDE_HEIGHT_IN * ROOT_IMAGE_VERTICAL_HEIGHT_RATIO,
        layoutType,
      };
    default:
      return full;
  }
}

export function computeContentArea(slide: PlateSlide): Rect {
  const margin = SLIDE_MARGIN_IN;
  const base: Rect = {
    x: margin,
    y: margin,
    w: SLIDE_WIDTH_IN - margin * 2,
    h: SLIDE_HEIGHT_IN - margin * 2,
  };
  if (!slide.rootImage || !slide.layoutType) return base;

  switch (slide.layoutType) {
    case "left":
      return {
        x: base.x + base.w * ROOT_IMAGE_WIDTH_RATIO,
        y: base.y,
        w: base.w * (1 - ROOT_IMAGE_WIDTH_RATIO),
        h: base.h,
      };
    case "right":
      return {
        x: base.x,
        y: base.y,
        w: base.w * (1 - ROOT_IMAGE_WIDTH_RATIO),
        h: base.h,
      };
    case "vertical":
      return {
        x: base.x,
        y: base.y + base.h * ROOT_IMAGE_VERTICAL_HEIGHT_RATIO,
        w: base.w,
        h: base.h * (1 - ROOT_IMAGE_VERTICAL_HEIGHT_RATIO),
      };
    default:
      return base;
  }
}

export function computeSlideLayout(slide: PlateSlide): {
  contentArea: Rect;
  rootImageFrame: RootImageFrame | null;
} {
  return {
    contentArea: computeContentArea(slide),
    rootImageFrame: slide.rootImage
      ? computeRootImageFrame(slide.layoutType)
      : null,
  };
}

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
