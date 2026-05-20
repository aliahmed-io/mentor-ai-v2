export const MIN_PRESENTATION_SLIDES = 5;
export const MAX_PRESENTATION_SLIDES = 30;

export function clampSlideCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_PRESENTATION_SLIDES;
  return Math.max(
    MIN_PRESENTATION_SLIDES,
    Math.min(MAX_PRESENTATION_SLIDES, Math.round(count)),
  );
}
