"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronRight,
  Cpu,
  FileSpreadsheet,
  Globe,
  Languages,
  LayoutGrid,
  MonitorCheck,
  Palette,
  Presentation,
  Sliders,
  Sparkles,
  Terminal,
  Tv,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getPresentation } from "@/app/_actions/presentation/presentationActions";
import { getCustomThemeById } from "@/app/_actions/presentation/theme-actions";
import { ThinkingDisplay } from "@/components/presentation/dashboard/ThinkingDisplay";
import { OutlineList } from "@/components/presentation/outline/OutlineList";
import { ToolCallDisplay } from "@/components/presentation/outline/ToolCallDisplay";
import { ImageSourceSelector } from "@/components/presentation/theme/ImageSourceSelector";
import { ThemeBackground } from "@/components/presentation/theme/ThemeBackground";
import { ThemeModal } from "@/components/presentation/theme/ThemeModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  clampSlideCount,
  MAX_PRESENTATION_SLIDES,
  MIN_PRESENTATION_SLIDES,
} from "@/lib/presentation/constants";
import {
  type ThemeProperties,
  type Themes,
  themes,
} from "@/lib/presentation/themes";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";

export const PRESENTATION_GENERATION_COOKIE = "presentation_generation_pending";

const PRESENTATION_STYLES = [
  { value: "professional", label: "Professional Vibe" },
  { value: "creative", label: "Creative Vibe" },
  { value: "minimal", label: "Minimal Vibe" },
  { value: "bold", label: "Bold Vibe" },
  { value: "elegant", label: "Elegant Vibe" },
];

export default function PresentationGenerateWithIdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const {
    // Current Presentation Data
    currentPresentationId,
    currentPresentationTitle,
    setCurrentPresentation,

    // Inputs & Prompt
    presentationInput,
    setPresentationInput,

    // Generation states
    startPresentationGeneration,
    isGeneratingPresentation,
    startOutlineGeneration,
    isGeneratingOutline,
    outlineThinking,

    // Deck configurations
    theme,
    setTheme,
    customThemeData,

    imageSource,
    setImageSource,
    imageModel,
    setImageModel,
    stockImageProvider,
    setStockImageProvider,

    presentationStyle,
    setPresentationStyle,

    numSlides,
    setNumSlides,

    language,
    setLanguage,

    pageStyle,
    setPageStyle,

    webSearchEnabled,
    setWebSearchEnabled,

    searchResults,
    setSearchResults,

    textModel,
    setTextModel,

    outline,
    setOutline,

    setShouldStartOutlineGeneration,
    generationStatus,
  } = usePresentationState();

  // Track if this is a fresh navigation or a revisit
  const initialLoadComplete = useRef(false);
  const generationStarted = useRef(false);

  // Use React Query to fetch presentation data
  const { data: presentationData, isLoading: isLoadingPresentation } = useQuery(
    {
      queryKey: ["presentation", id],
      queryFn: async () => {
        const result = await getPresentation(id);
        if (!result.success) {
          throw new Error(result.message ?? "Failed to load presentation");
        }
        return result.presentation;
      },
      enabled: !!id,
    },
  );

  // Clear the cookie when the page loads exactly once on mount
  useEffect(() => {
    if (typeof document === "undefined") return;

    const domain =
      window.location.hostname === "localhost" ? "localhost" : ".allweone.com";

    document.cookie = `${PRESENTATION_GENERATION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${domain !== "localhost" ? `domain=${domain}; ` : ""}`;
  }, []);

  // This effect handles the immediate startup of generation upon first mount
  // only if we're coming fresh from the dashboard (isGeneratingOutline === true)
  useEffect(() => {
    // Only run once on initial page load
    if (initialLoadComplete.current) return;
    initialLoadComplete.current = true;

    // If isGeneratingOutline is true but generation hasn't been started yet,
    // this indicates we just came from the dashboard and should start generation
    if (isGeneratingOutline && !generationStarted.current) {
      console.log("Starting outline generation after navigation");
      generationStarted.current = true;

      // Give the component time to fully mount and establish connections
      // before starting the generation process
      setTimeout(() => {
        setShouldStartOutlineGeneration(true);
      }, 100);
    }
  }, [isGeneratingOutline, setShouldStartOutlineGeneration]);

  // Update presentation state when data is fetched
  useEffect(() => {
    if (
      presentationData &&
      !isLoadingPresentation &&
      generationStatus === "idle"
    ) {
      // Prevent infinite sync loops if already synchronized
      if (currentPresentationId === presentationData.id) {
        return;
      }

      setCurrentPresentation(presentationData.id, presentationData.title);
      setPresentationInput(
        presentationData.presentation?.prompt ?? presentationData.title,
      );

      if (presentationData.presentation?.outline) {
        setOutline(presentationData.presentation.outline);
      }

      // Load search results if available
      if (presentationData.presentation?.searchResults) {
        try {
          const searchResults = Array.isArray(
            presentationData.presentation.searchResults,
          )
            ? presentationData.presentation.searchResults
            : JSON.parse(presentationData.presentation.searchResults as string);
          setWebSearchEnabled(true);
          setSearchResults(searchResults);
        } catch (error) {
          console.error("Failed to parse search results:", error);
          setSearchResults([]);
        }
      }

      // Set theme if available
      if (presentationData?.presentation?.theme) {
        const themeId = presentationData.presentation.theme;

        // Check if this is a predefined theme
        if (themeId in themes) {
          // Use predefined theme
          setTheme(themeId as Themes);
        } else {
          // If not in predefined themes, treat as custom theme
          void getCustomThemeById(themeId)
            .then((result) => {
              if (result.success && result.theme) {
                // Set the theme with the custom theme data
                const themeData = result.theme
                  .themeData as unknown as ThemeProperties;
                setTheme(themeId, themeData);
              } else {
                // Fallback to default theme if custom theme not found
                console.warn("Custom theme not found:", themeId);
                setTheme("mystique");
              }
            })
            .catch((error) => {
              console.error("Failed to load custom theme:", error);
              // Fallback to default theme on error
              setTheme("mystique");
            });
        }
      }

      // Set presentationStyle if available
      if (presentationData?.presentation?.presentationStyle) {
        setPresentationStyle(presentationData.presentation.presentationStyle);
      }

      if (presentationData?.presentation?.imageSource) {
        setImageSource(
          presentationData.presentation.imageSource as "ai" | "stock",
        );
      }

      // Set language if available
      if (presentationData.presentation?.language) {
        setLanguage(presentationData.presentation.language);
      }
    }
  }, [
    presentationData,
    isLoadingPresentation,
    currentPresentationId,
    setCurrentPresentation,
    setPresentationInput,
    setOutline,
    setTheme,
    setImageSource,
    setPresentationStyle,
    setLanguage,
    isGeneratingOutline,
    setSearchResults,
    setWebSearchEnabled,
  ]);

  const handleGenerateOutline = () => {
    if (!presentationInput.trim()) {
      toast.error("Please enter a presentation topic");
      return;
    }

    startOutlineGeneration();
  };

  const handleGenerate = () => {
    // Ensure state flag is set before navigating so the next page picks it up reliably
    startPresentationGeneration();
    router.push(`/presentation/${id}`);
  };

  // Stepper handlers
  const handleDecrementSlides = () => {
    setNumSlides(clampSlideCount(numSlides - 1));
  };

  const handleIncrementSlides = () => {
    setNumSlides(clampSlideCount(numSlides + 1));
  };

  if (isLoadingPresentation) {
    return (
      <ThemeBackground className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center space-y-6 p-8 rounded-3xl border bg-card/60 backdrop-blur-xl shadow-2xl max-w-sm w-full mx-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Spinner className="h-12 w-12 text-primary relative z-10" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Initializing Canvas
            </h2>
            <p className="text-sm text-muted-foreground">
              Retrieving presentation schemas...
            </p>
          </div>
        </div>
      </ThemeBackground>
    );
  }

  // Get active theme display properties
  let currentThemeOption: ThemeProperties | undefined;
  if (customThemeData) {
    currentThemeOption = customThemeData;
  } else if (theme && theme in themes) {
    currentThemeOption = themes[theme as keyof typeof themes];
  }

  const activeThemeName = currentThemeOption?.name ?? "Custom";

  return (
    <ThemeBackground className="flex min-h-screen flex-col overflow-hidden bg-background">
      {/* 1. Header Bar - Premium Glass Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 rounded-full bg-background/60 hover:bg-background/80 transition-all shadow-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Presenter Studio
              </span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20 animate-pulse">
                v2.5 Engine
              </span>
            </div>
            <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-[400px]">
              {currentPresentationTitle || "New AI Slide Deck"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/55 rounded-full px-3 py-1 border border-border/40">
            <MonitorCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Workspace Cloud Synced</span>
          </div>
        </div>
      </header>

      {/* 2. Main 12-Column Grid Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 lg:h-[calc(100vh-4.5rem)] lg:overflow-hidden flex-1 pb-32 lg:pb-6">
        {/* Left Column (col-span-4) - Design Studio Controls */}
        <section className="lg:col-span-4 flex flex-col gap-5 lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 pb-2 scrollbar-thin">
          {/* Box 1: Core Parameters & Engine Swapper */}
          <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl shadow-xl p-5 space-y-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Creative Parameters
              </h2>
            </div>

            {/* Cognitive Engine (Model Selector) */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  Cognitive AI Model
                </span>
                <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  API Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Gemini Engine Toggle */}
                <button
                  type="button"
                  onClick={() => setTextModel("gemini")}
                  className={cn(
                    "relative flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all duration-300",
                    textModel === "gemini"
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border/60 bg-background/40 hover:border-primary/45 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-foreground">
                      Google Gemini
                    </span>
                    {textModel === "gemini" && (
                      <span className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground leading-tight">
                    gemini-2.5-flash
                  </span>
                  <span className="mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">
                    100% Free / Stable
                  </span>
                </button>

                {/* OpenAI Engine Toggle */}
                <button
                  type="button"
                  onClick={() => setTextModel("openai")}
                  className={cn(
                    "relative flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all duration-300",
                    textModel === "openai"
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border/60 bg-background/40 hover:border-primary/45 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-foreground">
                      OpenAI GPT
                    </span>
                    {textModel === "openai" && (
                      <span className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground leading-tight">
                    gpt-4o-mini
                  </span>
                  <span className="mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/25 font-medium">
                    Rate limits apply
                  </span>
                </button>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* Layout, Slides & Web Search settings */}
            <div className="space-y-4">
              {/* Web Search Controls */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-background/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-sky-500" />
                    Web Search Research
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Fetches real-time web context
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isGeneratingOutline}
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50",
                    webSearchEnabled ? "bg-primary" : "bg-muted-foreground/35",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                      webSearchEnabled ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Slider for number of slides */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                    Slide Density
                  </span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {numSlides} Cards
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={handleDecrementSlides}
                    disabled={numSlides <= MIN_PRESENTATION_SLIDES}
                  >
                    -
                  </Button>
                  <input
                    type="range"
                    min={MIN_PRESENTATION_SLIDES}
                    max={MAX_PRESENTATION_SLIDES}
                    value={numSlides}
                    onChange={(e) =>
                      setNumSlides(clampSlideCount(Number(e.target.value)))
                    }
                    className="w-full accent-primary h-1.5 rounded-lg bg-muted cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={handleIncrementSlides}
                    disabled={numSlides >= MAX_PRESENTATION_SLIDES}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Language Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    Language
                  </span>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full rounded-xl text-xs h-9 bg-background/40">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    Page Format
                  </span>
                  <Select value={pageStyle} onValueChange={setPageStyle}>
                    <SelectTrigger className="w-full rounded-xl text-xs h-9 bg-background/40">
                      <SelectValue placeholder="Page Style" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="default">Default Ratio</SelectItem>
                      <SelectItem value="traditional">Traditional</SelectItem>
                      <SelectItem value="tall">Tall Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Presentational Style and Image Model Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Tv className="h-3 w-3" />
                    Vibe Vibe
                  </span>
                  <Select
                    value={presentationStyle}
                    onValueChange={setPresentationStyle}
                  >
                    <SelectTrigger className="w-full rounded-xl text-xs h-9 bg-background/40">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {PRESENTATION_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Visual Assets
                  </span>
                  <ImageSourceSelector
                    imageSource={imageSource}
                    imageModel={imageModel}
                    stockImageProvider={stockImageProvider}
                    onImageSourceChange={setImageSource}
                    onImageModelChange={setImageModel}
                    onStockImageProviderChange={setStockImageProvider}
                    showLabel={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Visual Style Gallery */}
          <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl shadow-xl p-5 flex-1 flex flex-col gap-4 min-h-[300px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4.5 w-4.5 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Brand Systems
                </h2>
              </div>
              <ThemeModal>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary font-bold"
                >
                  Custom Studio
                </Button>
              </ThemeModal>
            </div>

            <div className="text-[10px] text-muted-foreground leading-snug">
              Select a visual system design grid. Press Custom Studio above to
              design bespoke CSS layouts.
            </div>

            {/* Theme Scroller Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[350px] lg:max-h-[none] scrollbar-thin">
              {Object.entries(themes).map(([key, themeOption]) => {
                const isSelected = theme === key;
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
                      "w-full flex items-center justify-between gap-4 p-3 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border/50 bg-background/30 hover:border-primary/40 hover:bg-muted/40",
                    )}
                    style={{
                      borderRadius: themeOption.borderRadius,
                      boxShadow: isSelected ? modeShadows.card : undefined,
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: modeColors.heading,
                          fontFamily: themeOption.fonts.heading,
                        }}
                      >
                        {themeOption.name}
                      </span>
                      <span
                        className="text-[9px] line-clamp-1 opacity-70"
                        style={{
                          color: modeColors.text,
                          fontFamily: themeOption.fonts.body,
                        }}
                      >
                        {themeOption.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Swatch Strip */}
                      <div className="flex -space-x-1.5">
                        {[
                          modeColors.primary,
                          modeColors.secondary,
                          modeColors.accent,
                        ].map((color, i) => (
                          <div
                            key={i}
                            className="h-3.5 w-3.5 rounded-full ring-2 ring-background border border-white/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column (col-span-8) - Editor Studio Canvas */}
        <section className="lg:col-span-8 flex flex-col gap-6 lg:h-full lg:overflow-y-auto pb-16 pr-0 lg:pr-1 scrollbar-thin">
          {/* Box 1: Creative Directive console (Prompt editing) */}
          <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" />
                Creative Directive Prompt
              </span>
              <span className="text-[10px] text-muted-foreground">
                Edit theme topic details below
              </span>
            </div>

            <div className="relative">
              <textarea
                value={presentationInput}
                onChange={(e) => setPresentationInput(e.target.value)}
                className="w-full min-h-[90px] rounded-2xl border border-border/50 bg-background/55 p-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all duration-300 resize-none"
                placeholder="Describe your presentation slide deck topic here..."
                disabled={isGeneratingOutline}
              />
              <button
                type="button"
                onClick={handleGenerateOutline}
                disabled={isGeneratingOutline || !presentationInput.trim()}
                className={cn(
                  "absolute right-3.5 bottom-3.5 h-9 px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-300",
                  isGeneratingOutline
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20",
                )}
              >
                {isGeneratingOutline ? (
                  <Spinner className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                )}
                <span>Regenerate Outline</span>
              </button>
            </div>
          </div>

          {/* Box 2: Retro-Futuristic Cognitive Diagnostics Terminal */}
          <div className="rounded-3xl border border-border/40 bg-slate-950/95 shadow-2xl p-5 relative overflow-hidden font-mono">
            {/* Blurry glow */}
            <div className="absolute -top-12 -left-12 h-36 w-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 h-36 w-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                  Cognitive Processing Terminal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isGeneratingOutline
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-zinc-600",
                  )}
                />
                <span className="text-[10px] text-zinc-400 uppercase">
                  {isGeneratingOutline
                    ? "Inferencing..."
                    : "Awaiting directives"}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[100px] max-h-[220px] overflow-y-auto pr-1 text-xs scrollbar-thin">
              {/* Static System line */}
              <div className="text-zinc-500 flex gap-2">
                <span>[system]</span>
                <span>
                  Active engine initialized via{" "}
                  {textModel === "gemini"
                    ? "Google Gemini flash-2.5"
                    : "OpenAI gpt-4o-mini"}
                  .
                </span>
              </div>

              {/* Show thinking stream inside the terminal */}
              {outlineThinking ? (
                <div className="text-sky-400 space-y-2">
                  <div className="text-zinc-400 border-l-2 border-primary/30 pl-2 py-0.5 text-[11px] leading-relaxed">
                    <ThinkingDisplay
                      thinking={outlineThinking}
                      isGenerating={isGeneratingOutline}
                      title="AI Neural Thinking Console Log"
                    />
                  </div>
                </div>
              ) : null}

              {/* Show Tool Search Calls */}
              <ToolCallDisplay />

              {/* Idle State / Completion state logs */}
              {!isGeneratingOutline && !outlineThinking && (
                <div className="text-zinc-400 py-3 text-center text-xs flex flex-col items-center justify-center gap-2">
                  <span className="text-zinc-600 font-mono tracking-wide">
                    $ cat system_status.log
                  </span>
                  <span className="text-zinc-500 text-[11px] max-w-md">
                    CONSOLES_IDLE: Awaiting creative directives. Outline system
                    is online and ready. Modify parameter inputs on the left,
                    edit prompt directives above, or modify the slide deck card
                    outlines below.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Box 3: Slide Card Canvas deck */}
          <div className="rounded-3xl border border-border/40 bg-card/25 backdrop-blur-xl shadow-xl p-6 flex-1 flex flex-col">
            <OutlineList />
          </div>
        </section>
      </main>

      {/* 3. Floating Glassmorphic Action Bar (Bottom Center) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl px-1">
        <div className="rounded-full border border-white/10 bg-background/55 backdrop-blur-xl shadow-2xl p-2.5 flex items-center justify-between gap-6">
          <div className="pl-4 hidden sm:flex items-center gap-3">
            <Palette className="h-4.5 w-4.5 text-primary" />
            <div className="flex flex-col text-[10px]">
              <span className="text-muted-foreground leading-tight">
                ACTIVE BRAND SYSTEM
              </span>
              <span className="text-foreground font-bold tracking-wide uppercase">
                {activeThemeName} · {numSlides} Cards ·{" "}
                {language === "en-US"
                  ? "English"
                  : language === "fr"
                    ? "French"
                    : "Arabic"}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGeneratingPresentation || outline.length === 0}
            className="flex-1 sm:flex-none gap-2 rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group overflow-hidden relative"
          >
            {/* Shimmer effect */}
            <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />

            {isGeneratingPresentation ? (
              <>
                <Spinner className="h-4.5 w-4.5 text-primary-foreground" />
                <span>Assembling slides...</span>
              </>
            ) : (
              <>
                <Presentation className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                <span>Assemble & Generate Presentation</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </ThemeBackground>
  );
}
