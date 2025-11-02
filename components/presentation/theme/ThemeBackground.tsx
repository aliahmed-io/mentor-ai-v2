import {
  setThemeVariables,
  themes,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeBackgroundProps {
  className?: string;
  children: React.ReactNode;
}

export function ThemeBackground({ className, children }: ThemeBackgroundProps) {
  const presentationTheme = usePresentationState((s) => s.theme);
  const customThemeData = usePresentationState((s) => s.customThemeData);
  const config = usePresentationState((s) => s.config);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch by only rendering the gradient after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme variables whenever presentation theme or dark mode changes
  useEffect(() => {
    if (mounted && presentationTheme) {
      // Check if we're using a custom theme or a predefined theme
      if (customThemeData) {
        // Use custom theme data
        setThemeVariables(customThemeData, isDark);
      } else if (
        typeof presentationTheme === "string" &&
        presentationTheme in themes
      ) {
        // Use predefined theme
        setThemeVariables(
          themes[presentationTheme as keyof typeof themes],
          isDark,
        );
      }
    }
  }, [presentationTheme, customThemeData, isDark, mounted]);

  // Get the current theme colors
  let currentTheme: ThemeProperties | undefined;
  if (customThemeData) {
    currentTheme = customThemeData;
  } else if (
    typeof presentationTheme === "string" &&
    presentationTheme in themes
  ) {
    currentTheme = themes[presentationTheme as keyof typeof themes];
  }

  if (!currentTheme || !mounted) {
    return (
      <div className={cn("h-max min-h-full w-full bg-background", className)}>
        {children}
      </div>
    );
  }

  const colors = isDark ? currentTheme.colors.dark : currentTheme.colors.light;

  // Create gradient styles based on theme colors, allow override
  // Use app theme background for better consistency and readability; add subtle tint
  const defaultBackground = isDark
    ? `
        radial-gradient(circle at 15% 20%, ${colors.primary}22 0%, transparent 35%),
        radial-gradient(circle at 85% 80%, ${colors.accent}18 0%, transparent 45%),
        var(--background)
      `
    : `
        radial-gradient(circle at 15% 20%, ${colors.primary}12 0%, transparent 35%),
        radial-gradient(circle at 85% 80%, ${colors.accent}10 0%, transparent 45%),
        var(--background)
      `;

  const gradientStyle = {
    background: config.backgroundOverride ?? defaultBackground,
    transition: currentTheme.transitions.default,
    color: `hsl(var(--foreground))`,
  } as React.CSSProperties;

  return (
    <div
      className={cn("h-max min-h-full w-full text-foreground", className)}
      style={gradientStyle}
    >
      {children}
    </div>
  );
}
