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
  return slides.map((slide) => ({
    ...slide,
    bgColor: slide.bgColor ?? bg,
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
