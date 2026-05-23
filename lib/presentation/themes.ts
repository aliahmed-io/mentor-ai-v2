export type ThemeName =
  | "daktilo"
  | "cornflower"
  | "orbit"
  | "piano"
  | "mystique"
  | "gammaDark"
  | "crimson"
  | "sunset"
  | "forest"
  | "nord"
  | "dracula"
  | "monokai"
  | "synthwave"
  | "latte"
  | "mocha"
  | "sage"
  | "rosewater"
  | "velvet"
  | "matcha"
  | "obsidian"
  | "ocean"
  | "terracotta"
  | "amethyst"
  | "emerald"
  | "midnight"
  | "celestial"
  | "cyberneon"
  | "brutalist"
  | "vintage"
  | "ethereal"
  | "hacker"
  | "candy"
  | "corporate"
  | "newspaper"
  | "desert";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  heading: string;
  muted: string;
}

interface ThemeFonts {
  heading: string;
  body: string;
}

interface ThemeTransitions {
  default: string;
}

interface ThemeShadows {
  card: string;
  button: string;
}

export interface ThemeProperties {
  name: string;
  description: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  fonts: ThemeFonts;
  borderRadius: string;
  transitions: ThemeTransitions;
  shadows: {
    light: ThemeShadows;
    dark: ThemeShadows;
  };
}

export type Themes = keyof typeof themes;

export type PresentationColorMode = "light" | "dark";

export const PRESENTATION_FONT_OPTIONS = [
  "Inter",
  "Montserrat",
  "Raleway",
  "Merriweather",
  "Source Sans Pro",
  "DM Sans",
  "DM Serif Display",
  "Bitter",
  "JetBrains Mono",
  "Playfair Display",
  "Roboto",
  "Open Sans",
] as const;

export function applyTypographyOverride(
  theme: ThemeProperties,
  typography?: { heading?: string; body?: string },
): ThemeProperties {
  if (!typography?.heading && !typography?.body) return theme;
  return {
    ...theme,
    fonts: {
      heading: typography.heading ?? theme.fonts.heading,
      body: typography.body ?? theme.fonts.body,
    },
  };
}

export function getThemeSnapshot(
  themeKey: string,
  customThemeData: ThemeProperties | null,
  colorMode: PresentationColorMode,
  typography?: { heading?: string; body?: string },
): ThemeProperties & { activeColors: ThemeColors } {
  const base =
    customThemeData ??
    (themeKey in themes ? themes[themeKey as ThemeName] : themes.mystique);
  const withFonts = applyTypographyOverride(base, typography);
  const activeColors =
    colorMode === "dark" ? withFonts.colors.dark : withFonts.colors.light;
  return { ...withFonts, activeColors };
}

export const themes: Record<ThemeName, ThemeProperties> = {
  daktilo: {
    name: "Daktilo",
    description: "Modern and clean",
    colors: {
      light: {
        primary: "#3B82F6",
        secondary: "#1F2937",
        accent: "#60A5FA",
        background: "#FFFFFF",
        text: "#1F2937",
        heading: "#111827",
        muted: "#6B7280",
      },
      dark: {
        primary: "#60A5FA",
        secondary: "#E5E7EB",
        accent: "#93C5FD",
        background: "#111827",
        text: "#E5E7EB",
        heading: "#F9FAFB",
        muted: "#9CA3AF",
      },
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
    borderRadius: "0.5rem",
    transitions: {
      default: "all 0.2s ease-in-out",
    },
    shadows: {
      light: {
        card: "0 1px 3px rgba(0,0,0,0.12)",
        button: "0 2px 4px rgba(59,130,246,0.1)",
      },
      dark: {
        card: "0 1px 3px rgba(0,0,0,0.3)",
        button: "0 2px 4px rgba(96,165,250,0.2)",
      },
    },
  },

  cornflower: {
    name: "Cornflower",
    description: "Professional and bold",
    colors: {
      light: {
        primary: "#4F46E5",
        secondary: "#312E81",
        accent: "#818CF8",
        background: "#F8FAFC",
        text: "#334155",
        heading: "#1E293B",
        muted: "#64748B",
      },
      dark: {
        primary: "#818CF8",
        secondary: "#C7D2FE",
        accent: "#A5B4FC",
        background: "#1E1B4B",
        text: "#E2E8F0",
        heading: "#F8FAFC",
        muted: "#94A3B8",
      },
    },
    fonts: {
      heading: "Poppins",
      body: "Source Sans Pro",
    },
    borderRadius: "0.75rem",
    transitions: {
      default: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    shadows: {
      light: {
        card: "0 4px 6px rgba(0,0,0,0.05)",
        button: "0 4px 6px rgba(79,70,229,0.1)",
      },
      dark: {
        card: "0 4px 6px rgba(0,0,0,0.2)",
        button: "0 4px 6px rgba(129,140,248,0.2)",
      },
    },
  },

  orbit: {
    name: "Orbit",
    description: "Futuristic and dynamic",
    colors: {
      light: {
        primary: "#312E81",
        secondary: "#4338CA",
        accent: "#3B82F6",
        background: "#FFFFFF",
        text: "#1F2937",
        heading: "#111827",
        muted: "#6B7280",
      },
      dark: {
        primary: "#818CF8",
        secondary: "#A5B4FC",
        accent: "#60A5FA",
        background: "#030712",
        text: "#E5E7EB",
        heading: "#F9FAFB",
        muted: "#9CA3AF",
      },
    },
    fonts: {
      heading: "Space Grotesk",
      body: "IBM Plex Sans",
    },
    borderRadius: "1rem",
    transitions: {
      default: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    shadows: {
      light: {
        card: "0 8px 16px rgba(0,0,0,0.1)",
        button: "0 4px 12px rgba(49,46,129,0.1)",
      },
      dark: {
        card: "0 8px 16px rgba(0,0,0,0.4)",
        button: "0 4px 12px rgba(129,140,248,0.2)",
      },
    },
  },

  piano: {
    name: "Piano",
    description: "Classic and elegant",
    colors: {
      light: {
        primary: "#1F2937",
        secondary: "#374151",
        accent: "#4B5563",
        background: "#F3F4F6",
        text: "#374151",
        heading: "#111827",
        muted: "#6B7280",
      },
      dark: {
        primary: "#E5E7EB",
        secondary: "#D1D5DB",
        accent: "#9CA3AF",
        background: "#111827",
        text: "#E5E7EB",
        heading: "#F9FAFB",
        muted: "#9CA3AF",
      },
    },
    fonts: {
      heading: "Playfair Display",
      body: "Lora",
    },
    borderRadius: "0.25rem",
    transitions: {
      default: "all 0.2s ease",
    },
    shadows: {
      light: {
        card: "0 2px 4px rgba(0,0,0,0.08)",
        button: "0 1px 2px rgba(0,0,0,0.05)",
      },
      dark: {
        card: "0 2px 4px rgba(0,0,0,0.2)",
        button: "0 1px 2px rgba(255,255,255,0.1)",
      },
    },
  },

  mystique: {
    name: "Mystique",
    description: "Dark and sophisticated",
    colors: {
      light: {
        primary: "#7C3AED",
        secondary: "#5B21B6",
        accent: "#8B5CF6",
        background: "#F5F3FF",
        text: "#1F2937",
        heading: "#111827",
        muted: "#6B7280",
      },
      dark: {
        primary: "#A78BFA",
        secondary: "#8B5CF6",
        accent: "#C4B5FD",
        background: "#18181B",
        text: "#D4D4D8",
        heading: "#FAFAFA",
        muted: "#A1A1AA",
      },
    },
    fonts: {
      heading: "Montserrat",
      body: "Raleway",
    },
    borderRadius: "0.5rem",
    transitions: {
      default: "all 0.3s ease-out",
    },
    shadows: {
      light: {
        card: "0 4px 8px rgba(124,58,237,0.1)",
        button: "0 4px 12px rgba(124,58,237,0.15)",
      },
      dark: {
        card: "0 4px 8px rgba(167,139,250,0.2)",
        button: "0 4px 12px rgba(167,139,250,0.25)",
      },
    },
  },

  gammaDark: {
    name: "Gamma Dark",
    description: "High contrast",
    colors: {
      light: {
        primary: "#06B6D4",
        secondary: "#0E7490",
        accent: "#0EA5E9",
        background: "#FFFFFF",
        text: "#0F172A",
        heading: "#020617",
        muted: "#475569",
      },
      dark: {
        primary: "#22D3EE",
        secondary: "#67E8F9",
        accent: "#38BDF8",
        background: "#0F172A",
        text: "#E2E8F0",
        heading: "#F8FAFC",
        muted: "#94A3B8",
      },
    },
    fonts: {
      heading: "JetBrains Mono",
      body: "Inter",
    },
    borderRadius: "0.375rem",
    transitions: {
      default: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    shadows: {
      light: {
        card: "0 4px 12px rgba(6,182,212,0.1)",
        button: "0 4px 16px rgba(6,182,212,0.15)",
      },
      dark: {
        card: "0 4px 12px rgba(34,211,238,0.15)",
        button: "0 4px 16px rgba(34,211,238,0.2)",
      },
    },
  },

  crimson: {
    name: "Crimson",
    description: "Bold and passionate",
    colors: {
      light: {
        primary: "#DC2626",
        secondary: "#991B1B",
        accent: "#F87171",
        background: "#FFF1F2",
        text: "#1F2937",
        heading: "#111827",
        muted: "#6B7280",
      },
      dark: {
        primary: "#F87171",
        secondary: "#FCA5A5",
        accent: "#EF4444",
        background: "#18181B",
        text: "#E5E7EB",
        heading: "#F9FAFB",
        muted: "#9CA3AF",
      },
    },
    fonts: {
      heading: "Merriweather",
      body: "Source Sans Pro",
    },
    borderRadius: "0.5rem",
    transitions: {
      default: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    shadows: {
      light: {
        card: "0 4px 8px rgba(220,38,38,0.1)",
        button: "0 4px 12px rgba(220,38,38,0.15)",
      },
      dark: {
        card: "0 4px 8px rgba(248,113,113,0.2)",
        button: "0 4px 12px rgba(248,113,113,0.25)",
      },
    },
  },

  sunset: {
    name: "Sunset",
    description: "Warm and inviting",
    colors: {
      light: {
        primary: "#EA580C",
        secondary: "#C2410C",
        accent: "#FB923C",
        background: "#FFFBEB",
        text: "#292524",
        heading: "#1C1917",
        muted: "#78716C",
      },
      dark: {
        primary: "#FB923C",
        secondary: "#FDBA74",
        accent: "#F97316",
        background: "#1C1917",
        text: "#E7E5E4",
        heading: "#FAFAF9",
        muted: "#A8A29E",
      },
    },
    fonts: {
      heading: "DM Serif Display",
      body: "DM Sans",
    },
    borderRadius: "0.625rem",
    transitions: {
      default: "all 0.25s ease-in-out",
    },
    shadows: {
      light: {
        card: "0 4px 8px rgba(234,88,12,0.1)",
        button: "0 4px 12px rgba(234,88,12,0.15)",
      },
      dark: {
        card: "0 4px 8px rgba(251,146,60,0.2)",
        button: "0 4px 12px rgba(251,146,60,0.25)",
      },
    },
  },

  forest: {
    name: "Forest",
    description: "Natural and serene",
    colors: {
      light: {
        primary: "#059669",
        secondary: "#047857",
        accent: "#34D399",
        background: "#F0FDF4",
        text: "#1F2937",
        heading: "#064E3B",
        muted: "#6B7280",
      },
      dark: {
        primary: "#34D399",
        secondary: "#6EE7B7",
        accent: "#10B981",
        background: "#064E3B",
        text: "#E5E7EB",
        heading: "#ECFDF5",
        muted: "#9CA3AF",
      },
    },
    fonts: {
      heading: "Bitter",
      body: "Source Sans Pro",
    },
    borderRadius: "0.75rem",
    transitions: {
      default: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    shadows: {
      light: {
        card: "0 4px 12px rgba(5,150,105,0.08)",
        button: "0 3px 8px rgba(5,150,105,0.15)",
      },
      dark: {
        card: "0 4px 12px rgba(52,211,153,0.15)",
        button: "0 3px 8px rgba(52,211,153,0.2)",
      },
    },
  },
  nord: {
    name: "Nord",
    description: "Arctic, north-bluish color palette",
    colors: {
      light: {
        primary: "#5E81AC",
        secondary: "#81A1C1",
        accent: "#88C0D0",
        background: "#ECEFF4",
        text: "#2E3440",
        heading: "#3B4252",
        muted: "#D8DEE9",
      },
      dark: {
        primary: "#88C0D0",
        secondary: "#81A1C1",
        accent: "#5E81AC",
        background: "#2E3440",
        text: "#ECEFF4",
        heading: "#E5E9F0",
        muted: "#4C566A",
      },
    },
    fonts: { heading: "Inter", body: "Inter" },
    borderRadius: "0.375rem",
    transitions: { default: "all 0.2s ease" },
    shadows: {
      light: {
        card: "0 1px 3px rgba(46,52,64,0.1)",
        button: "0 2px 4px rgba(94,129,172,0.15)",
      },
      dark: {
        card: "0 1px 3px rgba(0,0,0,0.3)",
        button: "0 2px 4px rgba(136,192,208,0.2)",
      },
    },
  },
  dracula: {
    name: "Dracula",
    description: "Dark theme for bloodsuckers",
    colors: {
      light: {
        primary: "#BD93F9",
        secondary: "#FF79C6",
        accent: "#8BE9FD",
        background: "#F8F8F2",
        text: "#282A36",
        heading: "#44475A",
        muted: "#6272A4",
      },
      dark: {
        primary: "#BD93F9",
        secondary: "#FF79C6",
        accent: "#8BE9FD",
        background: "#282A36",
        text: "#F8F8F2",
        heading: "#FFFFFF",
        muted: "#6272A4",
      },
    },
    fonts: { heading: "JetBrains Mono", body: "Inter" },
    borderRadius: "0.5rem",
    transitions: { default: "all 0.25s ease" },
    shadows: {
      light: {
        card: "0 2px 5px rgba(40,42,54,0.1)",
        button: "0 2px 5px rgba(189,147,249,0.2)",
      },
      dark: {
        card: "0 2px 5px rgba(0,0,0,0.4)",
        button: "0 2px 5px rgba(189,147,249,0.3)",
      },
    },
  },
  monokai: {
    name: "Monokai",
    description: "Vibrant and contrasty",
    colors: {
      light: {
        primary: "#F92672",
        secondary: "#66D9EF",
        accent: "#A6E22E",
        background: "#F8F8F2",
        text: "#272822",
        heading: "#272822",
        muted: "#75715E",
      },
      dark: {
        primary: "#F92672",
        secondary: "#66D9EF",
        accent: "#A6E22E",
        background: "#272822",
        text: "#F8F8F2",
        heading: "#FFFFFF",
        muted: "#75715E",
      },
    },
    fonts: { heading: "Roboto", body: "Open Sans" },
    borderRadius: "0",
    transitions: { default: "all 0.2s ease" },
    shadows: {
      light: { card: "none", button: "0 2px 0 rgba(249,38,114,0.3)" },
      dark: { card: "none", button: "0 2px 0 rgba(249,38,114,0.5)" },
    },
  },
  synthwave: {
    name: "Synthwave",
    description: "Retro 80s neon aesthetic",
    colors: {
      light: {
        primary: "#FF2A6D",
        secondary: "#05D9E8",
        accent: "#01FFE6",
        background: "#F4F4F5",
        text: "#27193F",
        heading: "#11091F",
        muted: "#7C6C9C",
      },
      dark: {
        primary: "#FF2A6D",
        secondary: "#05D9E8",
        accent: "#01FFE6",
        background: "#27193F",
        text: "#F4F4F5",
        heading: "#FFFFFF",
        muted: "#7C6C9C",
      },
    },
    fonts: { heading: "Montserrat", body: "Inter" },
    borderRadius: "1rem",
    transitions: {
      default: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },
    shadows: {
      light: {
        card: "0 4px 15px rgba(39,25,63,0.1)",
        button: "0 0 10px rgba(255,42,109,0.4)",
      },
      dark: {
        card: "0 4px 15px rgba(0,0,0,0.5)",
        button: "0 0 15px rgba(255,42,109,0.6)",
      },
    },
  },
  latte: {
    name: "Latte",
    description: "Soft, warm, and creamy",
    colors: {
      light: {
        primary: "#D9A05B",
        secondary: "#8C6A5D",
        accent: "#C68B59",
        background: "#FDFBF7",
        text: "#4A3F35",
        heading: "#2D241E",
        muted: "#A89F91",
      },
      dark: {
        primary: "#E2B67C",
        secondary: "#A88B7D",
        accent: "#D6A376",
        background: "#332B25",
        text: "#F4EFE6",
        heading: "#FDFBF7",
        muted: "#8C8174",
      },
    },
    fonts: { heading: "Playfair Display", body: "DM Sans" },
    borderRadius: "0.5rem",
    transitions: { default: "all 0.4s ease-out" },
    shadows: {
      light: {
        card: "0 2px 8px rgba(74,63,53,0.05)",
        button: "0 2px 6px rgba(217,160,91,0.2)",
      },
      dark: {
        card: "0 2px 8px rgba(0,0,0,0.2)",
        button: "0 2px 6px rgba(226,182,124,0.1)",
      },
    },
  },
  mocha: {
    name: "Mocha",
    description: "Deep, rich coffee tones",
    colors: {
      light: {
        primary: "#8C5A40",
        secondary: "#5C3D2E",
        accent: "#A67B5B",
        background: "#F4EFEA",
        text: "#3A2E28",
        heading: "#1F1815",
        muted: "#9C8A81",
      },
      dark: {
        primary: "#D9A07E",
        secondary: "#8C5A40",
        accent: "#C48A69",
        background: "#2B211E",
        text: "#EBE3DC",
        heading: "#F9F6F4",
        muted: "#7A6B63",
      },
    },
    fonts: { heading: "DM Serif Display", body: "DM Sans" },
    borderRadius: "0.25rem",
    transitions: { default: "all 0.25s ease" },
    shadows: {
      light: {
        card: "0 4px 6px rgba(58,46,40,0.06)",
        button: "0 2px 4px rgba(140,90,64,0.2)",
      },
      dark: {
        card: "0 4px 6px rgba(0,0,0,0.25)",
        button: "0 2px 4px rgba(217,160,126,0.15)",
      },
    },
  },
  sage: {
    name: "Sage",
    description: "Calm, earthy greens",
    colors: {
      light: {
        primary: "#708A74",
        secondary: "#4A5D4E",
        accent: "#8FA893",
        background: "#F5F7F5",
        text: "#3B423D",
        heading: "#232924",
        muted: "#96A398",
      },
      dark: {
        primary: "#A3BDA7",
        secondary: "#708A74",
        accent: "#BED6C2",
        background: "#2E3630",
        text: "#E8EBE8",
        heading: "#F7F9F7",
        muted: "#6B7A6E",
      },
    },
    fonts: { heading: "Montserrat", body: "Open Sans" },
    borderRadius: "1rem",
    transitions: { default: "all 0.3s ease" },
    shadows: {
      light: {
        card: "0 2px 10px rgba(59,66,61,0.05)",
        button: "0 2px 5px rgba(112,138,116,0.2)",
      },
      dark: {
        card: "0 2px 10px rgba(0,0,0,0.2)",
        button: "0 2px 5px rgba(163,189,167,0.15)",
      },
    },
  },
  rosewater: {
    name: "Rosewater",
    description: "Delicate pinks and reds",
    colors: {
      light: {
        primary: "#D98695",
        secondary: "#A65B68",
        accent: "#F2A7B5",
        background: "#FDF9FA",
        text: "#4A3135",
        heading: "#2D1D20",
        muted: "#B89D9F",
      },
      dark: {
        primary: "#F2A7B5",
        secondary: "#D98695",
        accent: "#FFC2CD",
        background: "#382528",
        text: "#F7EBEB",
        heading: "#FEF7F8",
        muted: "#8C7375",
      },
    },
    fonts: { heading: "Playfair Display", body: "Raleway" },
    borderRadius: "2rem",
    transitions: { default: "all 0.3s ease-out" },
    shadows: {
      light: {
        card: "0 4px 12px rgba(74,49,53,0.04)",
        button: "0 4px 10px rgba(217,134,149,0.2)",
      },
      dark: {
        card: "0 4px 12px rgba(0,0,0,0.15)",
        button: "0 4px 10px rgba(242,167,181,0.15)",
      },
    },
  },
  velvet: {
    name: "Velvet",
    description: "Luxurious deep purples",
    colors: {
      light: {
        primary: "#6B2D5C",
        secondary: "#401835",
        accent: "#8C3F79",
        background: "#F9F6F8",
        text: "#33162C",
        heading: "#1A0915",
        muted: "#A38699",
      },
      dark: {
        primary: "#B55A9D",
        secondary: "#8C3F79",
        accent: "#D97AC0",
        background: "#260F20",
        text: "#F2E8F0",
        heading: "#FCF5FA",
        muted: "#825D76",
      },
    },
    fonts: { heading: "Merriweather", body: "Inter" },
    borderRadius: "0.125rem",
    transitions: { default: "all 0.25s ease-in-out" },
    shadows: {
      light: {
        card: "0 2px 4px rgba(51,22,44,0.08)",
        button: "0 2px 6px rgba(107,45,92,0.25)",
      },
      dark: {
        card: "0 2px 4px rgba(0,0,0,0.3)",
        button: "0 2px 6px rgba(181,90,157,0.2)",
      },
    },
  },
  matcha: {
    name: "Matcha",
    description: "Vibrant yellow-greens",
    colors: {
      light: {
        primary: "#8A9A5B",
        secondary: "#586638",
        accent: "#A5B573",
        background: "#FAFCF7",
        text: "#343D20",
        heading: "#1C2110",
        muted: "#A6AF92",
      },
      dark: {
        primary: "#B8C987",
        secondary: "#8A9A5B",
        accent: "#D2E3A1",
        background: "#282E18",
        text: "#F0F5E6",
        heading: "#FAFCF5",
        muted: "#7C8568",
      },
    },
    fonts: { heading: "DM Sans", body: "DM Sans" },
    borderRadius: "0.75rem",
    transitions: { default: "all 0.2s ease" },
    shadows: {
      light: {
        card: "0 4px 10px rgba(52,61,32,0.05)",
        button: "0 3px 6px rgba(138,154,91,0.2)",
      },
      dark: {
        card: "0 4px 10px rgba(0,0,0,0.2)",
        button: "0 3px 6px rgba(184,201,135,0.15)",
      },
    },
  },
  obsidian: {
    name: "Obsidian",
    description: "Sleek, dark, and minimal",
    colors: {
      light: {
        primary: "#2C2C2C",
        secondary: "#1A1A1A",
        accent: "#4A4A4A",
        background: "#FFFFFF",
        text: "#2C2C2C",
        heading: "#111111",
        muted: "#8C8C8C",
      },
      dark: {
        primary: "#E0E0E0",
        secondary: "#FFFFFF",
        accent: "#B0B0B0",
        background: "#0A0A0A",
        text: "#E0E0E0",
        heading: "#FFFFFF",
        muted: "#666666",
      },
    },
    fonts: { heading: "Inter", body: "Inter" },
    borderRadius: "0",
    transitions: { default: "all 0.2s linear" },
    shadows: {
      light: { card: "0 1px 2px rgba(0,0,0,0.05)", button: "none" },
      dark: { card: "0 1px 2px rgba(255,255,255,0.05)", button: "none" },
    },
  },
  ocean: {
    name: "Ocean",
    description: "Deep aquatic blues",
    colors: {
      light: {
        primary: "#006D77",
        secondary: "#00474F",
        accent: "#83C5BE",
        background: "#F0F7F7",
        text: "#1A3C40",
        heading: "#0D2124",
        muted: "#7CA5A8",
      },
      dark: {
        primary: "#83C5BE",
        secondary: "#006D77",
        accent: "#A5DFD9",
        background: "#0D2124",
        text: "#E4F0F0",
        heading: "#F2F9F9",
        muted: "#557D81",
      },
    },
    fonts: { heading: "Montserrat", body: "Inter" },
    borderRadius: "1.5rem",
    transitions: { default: "all 0.3s ease" },
    shadows: {
      light: {
        card: "0 4px 14px rgba(26,60,64,0.06)",
        button: "0 4px 8px rgba(0,109,119,0.2)",
      },
      dark: {
        card: "0 4px 14px rgba(0,0,0,0.25)",
        button: "0 4px 8px rgba(131,197,190,0.15)",
      },
    },
  },
  terracotta: {
    name: "Terracotta",
    description: "Earthy baked clay",
    colors: {
      light: {
        primary: "#D37556",
        secondary: "#A34C30",
        accent: "#E89B82",
        background: "#FAF4F2",
        text: "#4D2C22",
        heading: "#2C1710",
        muted: "#B3988F",
      },
      dark: {
        primary: "#E89B82",
        secondary: "#D37556",
        accent: "#F2B8A5",
        background: "#361D15",
        text: "#F5E9E6",
        heading: "#FDF9F8",
        muted: "#8C6A5F",
      },
    },
    fonts: { heading: "DM Serif Display", body: "Open Sans" },
    borderRadius: "0.375rem",
    transitions: { default: "all 0.25s ease" },
    shadows: {
      light: {
        card: "0 2px 8px rgba(77,44,34,0.05)",
        button: "0 2px 6px rgba(211,117,86,0.2)",
      },
      dark: {
        card: "0 2px 8px rgba(0,0,0,0.2)",
        button: "0 2px 6px rgba(232,155,130,0.15)",
      },
    },
  },
  amethyst: {
    name: "Amethyst",
    description: "Vibrant jewel tones",
    colors: {
      light: {
        primary: "#9B5DE5",
        secondary: "#702CB0",
        accent: "#BD8DF0",
        background: "#F8F5FB",
        text: "#3A2157",
        heading: "#1E1030",
        muted: "#A492B8",
      },
      dark: {
        primary: "#C39DF0",
        secondary: "#9B5DE5",
        accent: "#DFCAF6",
        background: "#211133",
        text: "#EFEAF5",
        heading: "#F9F6FC",
        muted: "#7D6499",
      },
    },
    fonts: { heading: "Raleway", body: "Inter" },
    borderRadius: "1rem",
    transitions: { default: "all 0.3s ease-out" },
    shadows: {
      light: {
        card: "0 4px 12px rgba(58,33,87,0.06)",
        button: "0 4px 10px rgba(155,93,229,0.25)",
      },
      dark: {
        card: "0 4px 12px rgba(0,0,0,0.25)",
        button: "0 4px 10px rgba(195,157,240,0.2)",
      },
    },
  },
  emerald: {
    name: "Emerald",
    description: "Deep, vivid greens",
    colors: {
      light: {
        primary: "#10B981",
        secondary: "#047857",
        accent: "#34D399",
        background: "#F2FBF7",
        text: "#1A3B30",
        heading: "#0C1F18",
        muted: "#8BAE9F",
      },
      dark: {
        primary: "#34D399",
        secondary: "#10B981",
        accent: "#6EE7B7",
        background: "#0F261D",
        text: "#E6F4EE",
        heading: "#F5FBF9",
        muted: "#55806D",
      },
    },
    fonts: { heading: "Inter", body: "Inter" },
    borderRadius: "0.5rem",
    transitions: { default: "all 0.2s ease" },
    shadows: {
      light: {
        card: "0 2px 6px rgba(26,59,48,0.05)",
        button: "0 2px 4px rgba(16,185,129,0.2)",
      },
      dark: {
        card: "0 2px 6px rgba(0,0,0,0.2)",
        button: "0 2px 4px rgba(52,211,153,0.15)",
      },
    },
  },
  midnight: {
    name: "Midnight",
    description: "Dark blue starry night",
    colors: {
      light: {
        primary: "#1E3A8A",
        secondary: "#172554",
        accent: "#3B82F6",
        background: "#F4F6FA",
        text: "#1E2436",
        heading: "#0D111C",
        muted: "#949FB8",
      },
      dark: {
        primary: "#3B82F6",
        secondary: "#1E3A8A",
        accent: "#60A5FA",
        background: "#0B1120",
        text: "#E8EAF1",
        heading: "#F6F7FA",
        muted: "#687693",
      },
    },
    fonts: { heading: "Montserrat", body: "Open Sans" },
    borderRadius: "0.375rem",
    transitions: { default: "all 0.25s ease-in-out" },
    shadows: {
      light: {
        card: "0 4px 10px rgba(30,36,54,0.05)",
        button: "0 2px 6px rgba(30,58,138,0.2)",
      },
      dark: {
        card: "0 4px 10px rgba(0,0,0,0.3)",
        button: "0 2px 6px rgba(59,130,246,0.2)",
      },
    },
  },
  celestial: {
    name: "Celestial",
    description: "Angelic white and gold heaven",
    colors: {
      light: {
        primary: "#D4AF37",
        secondary: "#F3E5AB",
        accent: "#FFD700",
        background: "#FFFFFF",
        text: "#4A4A4A",
        heading: "#2B2B2B",
        muted: "#A9A9A9",
      },
      dark: {
        primary: "#FFD700",
        secondary: "#D4AF37",
        accent: "#F3E5AB",
        background: "#0A0A0A",
        text: "#F5F5F5",
        heading: "#FFFFFF",
        muted: "#8C8C8C",
      },
    },
    fonts: { heading: "Playfair Display", body: "Inter" },
    borderRadius: "1rem",
    transitions: { default: "all 0.4s ease-out" },
    shadows: {
      light: {
        card: "0 8px 30px rgba(212,175,55,0.15)",
        button: "0 4px 15px rgba(212,175,55,0.3)",
      },
      dark: {
        card: "0 8px 30px rgba(255,215,0,0.1)",
        button: "0 4px 15px rgba(255,215,0,0.2)",
      },
    },
  },
  cyberneon: {
    name: "Cyber Neon",
    description: "High-contrast glowing neons",
    colors: {
      light: {
        primary: "#FF007F",
        secondary: "#00F0FF",
        accent: "#39FF14",
        background: "#0D0D0D",
        text: "#E0E0E0",
        heading: "#FFFFFF",
        muted: "#666666",
      },
      dark: {
        primary: "#FF007F",
        secondary: "#00F0FF",
        accent: "#39FF14",
        background: "#050505",
        text: "#F5F5F5",
        heading: "#FFFFFF",
        muted: "#808080",
      },
    },
    fonts: { heading: "Orbitron", body: "JetBrains Mono" },
    borderRadius: "0.25rem",
    transitions: { default: "all 0.15s linear" },
    shadows: {
      light: {
        card: "0 0 20px rgba(255,0,127,0.4)",
        button: "0 0 15px rgba(0,240,255,0.6)",
      },
      dark: {
        card: "0 0 25px rgba(255,0,127,0.5)",
        button: "0 0 20px rgba(0,240,255,0.8)",
      },
    },
  },
  brutalist: {
    name: "Brutalist",
    description: "Harsh edges, stark contrast",
    colors: {
      light: {
        primary: "#000000",
        secondary: "#FF3333",
        accent: "#FFCC00",
        background: "#F4F4F0",
        text: "#000000",
        heading: "#000000",
        muted: "#666666",
      },
      dark: {
        primary: "#FFFFFF",
        secondary: "#FF3333",
        accent: "#FFCC00",
        background: "#111111",
        text: "#FFFFFF",
        heading: "#FFFFFF",
        muted: "#999999",
      },
    },
    fonts: { heading: "Space Grotesk", body: "Space Grotesk" },
    borderRadius: "0",
    transitions: { default: "none" },
    shadows: {
      light: {
        card: "4px 4px 0px rgba(0,0,0,1)",
        button: "2px 2px 0px rgba(0,0,0,1)",
      },
      dark: {
        card: "4px 4px 0px rgba(255,255,255,1)",
        button: "2px 2px 0px rgba(255,255,255,1)",
      },
    },
  },
  vintage: {
    name: "Vintage 70s",
    description: "Retro warm autumn tones",
    colors: {
      light: {
        primary: "#D96C06",
        secondary: "#E6B04A",
        accent: "#7B8C46",
        background: "#F5EEDC",
        text: "#4A3B2C",
        heading: "#2C1E16",
        muted: "#A3927A",
      },
      dark: {
        primary: "#E6B04A",
        secondary: "#D96C06",
        accent: "#9CA861",
        background: "#3A2A20",
        text: "#EBE3D5",
        heading: "#F5EEDC",
        muted: "#8C7A6B",
      },
    },
    fonts: { heading: "PT Serif", body: "Open Sans" },
    borderRadius: "0.5rem",
    transitions: { default: "all 0.3s ease-in-out" },
    shadows: {
      light: {
        card: "0 4px 12px rgba(74,59,44,0.08)",
        button: "0 2px 4px rgba(217,108,6,0.2)",
      },
      dark: {
        card: "0 4px 12px rgba(0,0,0,0.3)",
        button: "0 2px 4px rgba(230,176,74,0.2)",
      },
    },
  },
  ethereal: {
    name: "Ethereal",
    description: "Soft, dreamy, airy clouds",
    colors: {
      light: {
        primary: "#A3B8E1",
        secondary: "#E8D8F8",
        accent: "#C2D4F2",
        background: "#FAFBFF",
        text: "#5C6B8A",
        heading: "#3A4B6B",
        muted: "#B5C1D9",
      },
      dark: {
        primary: "#C2D4F2",
        secondary: "#A3B8E1",
        accent: "#E8D8F8",
        background: "#1A2235",
        text: "#EAF0FA",
        heading: "#FFFFFF",
        muted: "#6D7E9E",
      },
    },
    fonts: { heading: "Cormorant Garamond", body: "Raleway" },
    borderRadius: "2rem",
    transitions: { default: "all 0.5s ease" },
    shadows: {
      light: {
        card: "0 10px 40px rgba(163,184,225,0.15)",
        button: "0 4px 12px rgba(163,184,225,0.3)",
      },
      dark: {
        card: "0 10px 40px rgba(0,0,0,0.4)",
        button: "0 4px 12px rgba(194,212,242,0.2)",
      },
    },
  },
  hacker: {
    name: "Hacker",
    description: "Terminal matrix aesthetic",
    colors: {
      light: {
        primary: "#00FF41",
        secondary: "#008F11",
        accent: "#003B00",
        background: "#0D0208",
        text: "#00FF41",
        heading: "#00FF41",
        muted: "#008F11",
      },
      dark: {
        primary: "#00FF41",
        secondary: "#008F11",
        accent: "#003B00",
        background: "#050103",
        text: "#00FF41",
        heading: "#00FF41",
        muted: "#008F11",
      },
    },
    fonts: { heading: "Fira Code", body: "Fira Code" },
    borderRadius: "0",
    transitions: { default: "none" },
    shadows: {
      light: {
        card: "0 0 10px rgba(0,255,65,0.2)",
        button: "0 0 10px rgba(0,255,65,0.4)",
      },
      dark: {
        card: "0 0 15px rgba(0,255,65,0.3)",
        button: "0 0 15px rgba(0,255,65,0.5)",
      },
    },
  },
  candy: {
    name: "Candy Pop",
    description: "Kawaii bubblegum pastels",
    colors: {
      light: {
        primary: "#FF9CEE",
        secondary: "#AEE5D8",
        accent: "#FDFD96",
        background: "#FFF5FA",
        text: "#6B5B65",
        heading: "#FF73D8",
        muted: "#C2AAB5",
      },
      dark: {
        primary: "#FF73D8",
        secondary: "#82C9B8",
        accent: "#E5E56B",
        background: "#3A2E35",
        text: "#FFF5FA",
        heading: "#FF9CEE",
        muted: "#948089",
      },
    },
    fonts: { heading: "Quicksand", body: "Nunito" },
    borderRadius: "2rem",
    transitions: { default: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" },
    shadows: {
      light: {
        card: "0 8px 24px rgba(255,156,238,0.2)",
        button: "0 4px 10px rgba(174,229,216,0.3)",
      },
      dark: {
        card: "0 8px 24px rgba(0,0,0,0.2)",
        button: "0 4px 10px rgba(255,115,216,0.25)",
      },
    },
  },
  corporate: {
    name: "Corporate",
    description: "Ultra-professional enterprise",
    colors: {
      light: {
        primary: "#0F3A7A",
        secondary: "#495057",
        accent: "#2F65B8",
        background: "#F8F9FA",
        text: "#212529",
        heading: "#15243B",
        muted: "#ADB5BD",
      },
      dark: {
        primary: "#2F65B8",
        secondary: "#CED4DA",
        accent: "#5285D4",
        background: "#111827",
        text: "#F8F9FA",
        heading: "#FFFFFF",
        muted: "#6C757D",
      },
    },
    fonts: { heading: "Inter", body: "Inter" },
    borderRadius: "0.25rem",
    transitions: { default: "all 0.2s ease" },
    shadows: {
      light: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        button: "0 2px 4px rgba(15,58,122,0.15)",
      },
      dark: {
        card: "0 1px 3px rgba(0,0,0,0.3)",
        button: "0 2px 4px rgba(47,101,184,0.2)",
      },
    },
  },
  newspaper: {
    name: "Newspaper",
    description: "Classic editorial serif",
    colors: {
      light: {
        primary: "#1A1A1A",
        secondary: "#4D4D4D",
        accent: "#8B0000",
        background: "#F4F1EA",
        text: "#222222",
        heading: "#111111",
        muted: "#737373",
      },
      dark: {
        primary: "#EAEAEA",
        secondary: "#A6A6A6",
        accent: "#FF4D4D",
        background: "#1C1B1A",
        text: "#D4D4D4",
        heading: "#F0F0F0",
        muted: "#8C8C8C",
      },
    },
    fonts: { heading: "Merriweather", body: "Lora" },
    borderRadius: "0",
    transitions: { default: "all 0.2s ease" },
    shadows: {
      light: {
        card: "0 2px 8px rgba(0,0,0,0.04)",
        button: "0 2px 4px rgba(0,0,0,0.1)",
      },
      dark: {
        card: "0 2px 8px rgba(0,0,0,0.3)",
        button: "0 2px 4px rgba(255,255,255,0.05)",
      },
    },
  },
  desert: {
    name: "Desert Dune",
    description: "Arid sands and spice",
    colors: {
      light: {
        primary: "#C19A6B",
        secondary: "#8B5A2B",
        accent: "#D2B48C",
        background: "#FDF8F5",
        text: "#4A3728",
        heading: "#2B1A10",
        muted: "#A68A75",
      },
      dark: {
        primary: "#D2B48C",
        secondary: "#C19A6B",
        accent: "#F3E5AB",
        background: "#2B1A10",
        text: "#F3EBE4",
        heading: "#FFFFFF",
        muted: "#8B6F58",
      },
    },
    fonts: { heading: "Cinzel", body: "Open Sans" },
    borderRadius: "0.125rem",
    transitions: { default: "all 0.3s ease" },
    shadows: {
      light: {
        card: "0 4px 15px rgba(139,90,43,0.08)",
        button: "0 2px 6px rgba(193,154,107,0.2)",
      },
      dark: {
        card: "0 4px 15px rgba(0,0,0,0.25)",
        button: "0 2px 6px rgba(210,180,140,0.15)",
      },
    },
  },
};

// Function to set CSS variables for a theme
export function setThemeVariables(theme: ThemeProperties, isDark: boolean) {
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const shadows = isDark ? theme.shadows.dark : theme.shadows.light;

  // Set CSS variables
  document.documentElement.style.setProperty(
    "--presentation-primary",
    colors.primary,
  );
  document.documentElement.style.setProperty(
    "--presentation-secondary",
    colors.secondary,
  );
  document.documentElement.style.setProperty(
    "--presentation-accent",
    colors.accent,
  );
  document.documentElement.style.setProperty(
    "--presentation-background",
    colors.background,
  );
  document.documentElement.style.setProperty(
    "--presentation-text",
    colors.text,
  );
  document.documentElement.style.setProperty(
    "--presentation-heading",
    colors.heading,
  );
  document.documentElement.style.setProperty(
    "--presentation-muted",
    colors.muted,
  );
  document.documentElement.style.setProperty(
    "--presentation-heading-font",
    theme.fonts.heading,
  );
  document.documentElement.style.setProperty(
    "--presentation-body-font",
    theme.fonts.body,
  );
  document.documentElement.style.setProperty(
    "--presentation-border-radius",
    theme.borderRadius,
  );
  document.documentElement.style.setProperty(
    "--presentation-transition",
    theme.transitions.default,
  );
  document.documentElement.style.setProperty(
    "--presentation-card-shadow",
    shadows.card,
  );
  document.documentElement.style.setProperty(
    "--presentation-button-shadow",
    shadows.button,
  );
}
