import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStyleDefaultTheme } from "@/lib/presentation/layout-recipes";
import {
  PRESENTATION_FONT_OPTIONS,
  type Themes,
  themes,
} from "@/lib/presentation/themes";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { ImageSourceSelector } from "./ImageSourceSelector";
import { ThemeModal } from "./ThemeModal";

const PRESENTATION_STYLES = [
  { value: "professional", label: "Professional", desc: "Data-focused layouts with charts & tables.", icon: "📊" },
  { value: "creative", label: "Creative", desc: "Storytelling workflows with icons & cycles.", icon: "🎨" },
  { value: "minimal", label: "Minimal", desc: "High clarity, punchy items & crisp margins.", icon: "🔳" },
  { value: "bold", label: "Bold", desc: "Impactful statements, pyramids & staircases.", icon: "⚡" },
  { value: "elegant", label: "Elegant", desc: "Refined timelines & sophisticated structures.", icon: "✨" },
];

export function ThemeSettings() {
  const {
    theme,
    setTheme,
    imageModel,
    setImageModel,
    imageSource,
    setImageSource,
    stockImageProvider,
    setStockImageProvider,
  } = usePresentationState();
  const presentationColorMode = usePresentationState(
    (s) => s.presentationColorMode,
  );
  const setPresentationColorMode = usePresentationState(
    (s) => s.setPresentationColorMode,
  );
  const isDark = presentationColorMode === "dark";

  const presentationStyle = usePresentationState((s) => s.presentationStyle);
  const setPresentationStyle = usePresentationState(
    (s) => s.setPresentationStyle,
  );
  const config = usePresentationState((s) => s.config);
  const setConfig = usePresentationState((s) => s.setConfig);
  const typography = (config.typography ?? {}) as {
    heading?: string;
    body?: string;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Slide appearance</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={presentationColorMode === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setPresentationColorMode("light")}
          >
            Light slides
          </Button>
          <Button
            type="button"
            variant={presentationColorMode === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setPresentationColorMode("dark")}
          >
            Dark slides
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Controls slide background and export colors, independent of app theme.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Typography</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Heading font</Label>
            <Select
              value={typography.heading ?? ""}
              onValueChange={(heading) =>
                setConfig({
                  ...config,
                  typography: { ...typography, heading },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Theme default" />
              </SelectTrigger>
              <SelectContent>
                {PRESENTATION_FONT_OPTIONS.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Body font</Label>
            <Select
              value={typography.body ?? ""}
              onValueChange={(body) =>
                setConfig({
                  ...config,
                  typography: { ...typography, body },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Theme default" />
              </SelectTrigger>
              <SelectContent>
                {PRESENTATION_FONT_OPTIONS.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Theme & Layout</Label>
          <ThemeModal>
            <Button variant={"link"}>More Themes</Button>
          </ThemeModal>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(themes).map(([key, themeOption]) => {
            const modeColors = isDark
              ? themeOption.colors.dark
              : themeOption.colors.light;
            const modeShadows = isDark
              ? themeOption.shadows.dark
              : themeOption.shadows.light;

            return (
              <button
                key={key}
                onClick={() => setTheme(key as Themes)}
                className={cn(
                  "group relative space-y-3 rounded-lg border p-4 text-left transition-all hover:scale-[1.01] hover:shadow-md",
                  theme === key
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-muted hover:border-primary/50 hover:bg-muted/50",
                )}
                style={{
                  borderRadius: themeOption.borderRadius,
                  boxShadow: modeShadows.card,
                  transition: themeOption.transitions.default,
                  backgroundColor:
                    theme === key
                      ? `${modeColors.primary}${isDark ? "15" : "08"}`
                      : isDark
                        ? "rgba(0,0,0,0.3)"
                        : "rgba(255,255,255,0.9)",
                }}
              >
                <div className="flex justify-between items-start">
                  <div
                    className="font-semibold text-base"
                    style={{
                      color: modeColors.heading,
                      fontFamily: themeOption.fonts.heading,
                    }}
                  >
                    {themeOption.name}
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      modeColors.primary,
                      modeColors.secondary,
                      modeColors.accent,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-full ring-1 ring-inset ring-white/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div
                  className="text-xs opacity-90 leading-relaxed line-clamp-2"
                  style={{
                    color: modeColors.text,
                    fontFamily: themeOption.fonts.body,
                  }}
                >
                  {themeOption.description}
                </div>
                <div
                  className="mt-3 flex items-center justify-between text-[11px] border-t border-muted/20 pt-2"
                  style={{ color: modeColors.muted }}
                >
                  <div className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-75">Typography</span>
                    <span className="block font-medium truncate" style={{ fontFamily: themeOption.fonts.heading }}>
                      {themeOption.fonts.heading.split(',')[0]}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-75">Sample</span>
                    <span className="block text-xs font-semibold" style={{ fontFamily: themeOption.fonts.heading }}>Aa</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <ImageSourceSelector
        imageSource={imageSource}
        imageModel={imageModel}
        stockImageProvider={stockImageProvider}
        onImageSourceChange={setImageSource}
        onImageModelChange={setImageModel}
        onStockImageProviderChange={setStockImageProvider}
        className="space-y-4"
        showLabel={true}
      />

      <div className="space-y-4">
        <Label className="text-sm font-medium">Presentation Style</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRESENTATION_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => {
                setPresentationStyle(style.value);
                setTheme(getStyleDefaultTheme(style.value) as Themes);
              }}
              className={cn(
                "group flex flex-col justify-between rounded-lg border p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-sm",
                presentationStyle === style.value
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/5"
                  : "border-muted hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{style.icon}</span>
                <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {style.label}
                </span>
              </div>
              <span className="mt-2 text-xs text-muted-foreground leading-normal">
                {style.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
