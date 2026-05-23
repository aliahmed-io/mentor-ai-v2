import type { PlateSlide } from "@/components/presentation/utils/parser";
import {
  applyTypographyOverride,
  getThemeSnapshot,
  type PresentationColorMode,
  type ThemeName,
  type ThemeProperties,
  themes,
} from "./themes";

export function bakeThemeIntoSlides(
  slides: PlateSlide[],
  themeKey: string,
  colorMode: PresentationColorMode,
  customThemeData: ThemeProperties | null,
  typography?: { heading?: string; body?: string },
): PlateSlide[] {
  const snapshot = getThemeSnapshot(
    themeKey,
    customThemeData,
    colorMode,
    typography,
  );
  const bg = snapshot.activeColors.background;

  const colors = snapshot.activeColors;
  const shadows =
    colorMode === "dark" ? snapshot.shadows.dark : snapshot.shadows.light;

  const themeStyles = {
    "--presentation-primary": colors.primary,
    "--presentation-secondary": colors.secondary,
    "--presentation-accent": colors.accent,
    "--presentation-background": colors.background,
    "--presentation-text": colors.text,
    "--presentation-heading": colors.heading,
    "--presentation-muted": colors.muted,
    "--presentation-heading-font": snapshot.fonts.heading,
    "--presentation-body-font": snapshot.fonts.body,
    "--presentation-border-radius": snapshot.borderRadius,
    "--presentation-transition": snapshot.transitions.default,
    "--presentation-card-shadow": shadows.card,
    "--presentation-button-shadow": shadows.button,
  } as Record<string, string>;

  return slides.map((slide) => ({
    ...slide,
    bgColor: slide.bgColor ?? bg,
    themeStyles,
  }));
}

export function resolveActiveTheme(
  themeKey: string,
  customThemeData: ThemeProperties | null,
  colorMode: PresentationColorMode,
  typography?: { heading?: string; body?: string },
): ThemeProperties {
  const base =
    customThemeData ??
    (themeKey in themes ? themes[themeKey as ThemeName] : themes.mystique);
  return applyTypographyOverride(base, typography);
}
