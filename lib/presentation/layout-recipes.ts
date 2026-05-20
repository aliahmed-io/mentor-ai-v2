export type RichComponent =
  | "BULLETS"
  | "ICONS"
  | "CHART"
  | "TABLE"
  | "TIMELINE"
  | "CYCLE"
  | "COMPARE"
  | "COLUMNS"
  | "BOXES"
  | "BEFORE-AFTER"
  | "PROS-CONS"
  | "PYRAMID"
  | "STAIRCASE"
  | "ARROWS"
  | "ARROW-VERTICAL";

export type PresentationStyle =
  | "professional"
  | "creative"
  | "minimal"
  | "bold"
  | "elegant";

export type LayoutType = "left" | "right" | "vertical";

const STYLE_COMPONENT_ROTATION: Record<PresentationStyle, RichComponent[]> = {
  professional: ["CHART", "TABLE", "COMPARE", "COLUMNS", "BULLETS"],
  creative: ["ICONS", "CYCLE", "TIMELINE", "BEFORE-AFTER", "PYRAMID"],
  minimal: ["BULLETS", "BOXES", "COMPARE", "COLUMNS", "BULLETS"],
  bold: ["STAIRCASE", "PYRAMID", "PROS-CONS", "ARROWS", "BULLETS"],
  elegant: ["TIMELINE", "COLUMNS", "BEFORE-AFTER", "TABLE", "BULLETS"],
};

const LAYOUT_ROTATION: LayoutType[] = [
  "vertical",
  "left",
  "right",
  "left",
  "vertical",
];

/** Default visual theme when user picks a presentation style */
export const STYLE_DEFAULT_THEMES: Record<PresentationStyle, string> = {
  professional: "daktilo",
  creative: "orbit",
  minimal: "piano",
  bold: "crimson",
  elegant: "mystique",
};

export function normalizePresentationStyle(
  style: string | undefined,
): PresentationStyle {
  if (style && style in STYLE_COMPONENT_ROTATION) {
    return style as PresentationStyle;
  }
  return "professional";
}

export function getRequiredComponent(
  style: string | undefined,
  slideIndex: number,
): RichComponent {
  const normalized = normalizePresentationStyle(style);
  const rotation = STYLE_COMPONENT_ROTATION[normalized];
  return rotation[slideIndex % rotation.length]!;
}

export function getLayoutForSlide(slideIndex: number): LayoutType {
  return LAYOUT_ROTATION[slideIndex % LAYOUT_ROTATION.length]!;
}

export function getStyleDefaultTheme(style: string | undefined): string {
  const normalized = normalizePresentationStyle(style);
  return STYLE_DEFAULT_THEMES[normalized];
}
