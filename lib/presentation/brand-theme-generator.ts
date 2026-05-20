import type { ThemeColors, ThemeProperties } from "./themes";

// Dynamic Brand Theme Generator for next-level customization
export function generateThemeFromBrand(brandInput: string): ThemeProperties {
  const normalized = brandInput.trim().toLowerCase();

  // 1. Preset Brand Colors (Stripe, Apple, Airbnb, etc.)
  if (normalized.includes("stripe")) {
    return createBrandTheme(
      "Stripe Style",
      "Stripe-inspired premium gradient tech brand theme.",
      {
        primary: "#635bff",
        secondary: "#0a2540",
        accent: "#00d4b2",
        background: "#ffffff",
        text: "#425466",
        heading: "#0a2540",
        muted: "#69798a",
      },
      {
        primary: "#80e9ff",
        secondary: "#adbdcc",
        accent: "#00d4b2",
        background: "#0a0d14",
        text: "#adbdcc",
        heading: "#ffffff",
        muted: "#69798a",
      },
      "DM Sans",
      "Inter",
    );
  }

  if (normalized.includes("apple")) {
    return createBrandTheme(
      "Apple Classic",
      "Apple-inspired minimalist luxury tech aesthetic.",
      {
        primary: "#1d1d1f",
        secondary: "#86868b",
        accent: "#0071e3",
        background: "#ffffff",
        text: "#1d1d1f",
        heading: "#000000",
        muted: "#86868b",
      },
      {
        primary: "#f5f5f7",
        secondary: "#86868b",
        accent: "#2997ff",
        background: "#000000",
        text: "#f5f5f7",
        heading: "#ffffff",
        muted: "#86868b",
      },
      "SF Pro Display, Montserrat",
      "SF Pro Text, Inter",
    );
  }

  if (normalized.includes("airbnb")) {
    return createBrandTheme(
      "Airbnb Cereal",
      "Airbnb-inspired warm, modern community brand theme.",
      {
        primary: "#ff5a5f",
        secondary: "#484848",
        accent: "#008489",
        background: "#ffffff",
        text: "#484848",
        heading: "#222222",
        muted: "#767676",
      },
      {
        primary: "#ff5a5f",
        secondary: "#e4e4e4",
        accent: "#008489",
        background: "#121212",
        text: "#e4e4e4",
        heading: "#ffffff",
        muted: "#767676",
      },
      "Circular, Poppins",
      "Circular, DM Sans",
    );
  }

  if (normalized.includes("spotify")) {
    return createBrandTheme(
      "Spotify Green",
      "Spotify-inspired vibrant neon music brand theme.",
      {
        primary: "#1db954",
        secondary: "#191414",
        accent: "#1ed760",
        background: "#ffffff",
        text: "#191414",
        heading: "#191414",
        muted: "#919191",
      },
      {
        primary: "#1db954",
        secondary: "#ffffff",
        accent: "#1ed760",
        background: "#121212",
        text: "#b3b3b3",
        heading: "#ffffff",
        muted: "#a7a7a7",
      },
      "Montserrat",
      "Inter",
    );
  }

  if (normalized.includes("google")) {
    return createBrandTheme(
      "Google Smart",
      "Google-inspired playful and clean corporate brand theme.",
      {
        primary: "#4285f4",
        secondary: "#34a853",
        accent: "#ea4335",
        background: "#ffffff",
        text: "#3c4043",
        heading: "#202124",
        muted: "#70757a",
      },
      {
        primary: "#8ab4f8",
        secondary: "#81c995",
        accent: "#f28b82",
        background: "#202124",
        text: "#e8eaed",
        heading: "#ffffff",
        muted: "#9aa0a6",
      },
      "Product Sans, Google Sans, Montserrat",
      "Roboto, Open Sans",
    );
  }

  // 2. Fallback: Dynamic HSL Palette Generation from Brand Hash
  const hash = getHashCode(normalized);
  const hue = Math.abs(hash % 360);

  // Generate gorgeous colors using color theory
  const primaryLight = hslToHex(hue, 70, 45); // Rich primary
  const secondaryLight = hslToHex((hue + 40) % 360, 50, 30); // Warm neighbor
  const accentLight = hslToHex((hue + 180) % 360, 85, 50); // High contrast complement
  const backgroundLight = hslToHex(hue, 15, 98); // Light tinted background
  const textLight = hslToHex(hue, 20, 20);
  const headingLight = hslToHex(hue, 25, 12);
  const mutedLight = hslToHex(hue, 15, 50);

  const primaryDark = hslToHex(hue, 80, 60); // Vibrant pastel primary
  const secondaryDark = hslToHex((hue + 40) % 360, 40, 75);
  const accentDark = hslToHex((hue + 180) % 360, 85, 60);
  const backgroundDark = hslToHex(hue, 20, 8); // Color-tinted dark obsidian background
  const textDark = hslToHex(hue, 15, 88);
  const headingDark = "#ffffff";
  const mutedDark = hslToHex(hue, 10, 60);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const displayName = capitalize(normalized.split(".")[0] || "Custom Brand");

  return createBrandTheme(
    `${displayName} Palette`,
    `AI-synthesized color system inspired by ${brandInput}.`,
    {
      primary: primaryLight,
      secondary: secondaryLight,
      accent: accentLight,
      background: backgroundLight,
      text: textLight,
      heading: headingLight,
      muted: mutedLight,
    },
    {
      primary: primaryDark,
      secondary: secondaryDark,
      accent: accentDark,
      background: backgroundDark,
      text: textDark,
      heading: headingDark,
      muted: mutedDark,
    },
    "Space Grotesk, Montserrat",
    "Inter",
  );
}

// Helpers
function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function createBrandTheme(
  name: string,
  description: string,
  light: ThemeColors,
  dark: ThemeColors,
  headingFont: string,
  bodyFont: string,
): ThemeProperties {
  return {
    name,
    description,
    colors: { light, dark },
    fonts: {
      heading: headingFont,
      body: bodyFont,
    },
    borderRadius: "0.75rem",
    transitions: {
      default: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    shadows: {
      light: {
        card: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        button:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      dark: {
        card: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        button:
          "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)",
      },
    },
  };
}
