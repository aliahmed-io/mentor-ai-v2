"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronRight,
  Cpu,
  FileSpreadsheet,
  FileText,
  Globe,
  Languages,
  LayoutGrid,
  MonitorCheck,
  Palette,
  Presentation,
  Settings2,
  Sliders,
  Sparkles,
  Terminal,
  Tv,
  Type,
  Upload,
  X,
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
import UploadForm from "@/components/UploadForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    setIsGeneratingPresentation,
    slides,
    setSlides,
  } = usePresentationState();

  const handleUploaded = (data: { sessionId: string; text: string }) => {
    if (!data) return;
    setPresentationInput(
      (presentationInput ? `${presentationInput}\n\n` : "") + data.text,
    );
  };

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

      {/* 2. Main Layout (Sidebar + Canvas) */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4.5rem)] w-full overflow-hidden p-4 md:p-6 gap-6">
        {/* Left Sidebar - Settings & Themes */}
        <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4 h-full overflow-y-auto pr-2 pb-32 lg:pb-2 scrollbar-thin">
          {/* Quick Settings Card */}
          <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md p-4 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Document Settings
              </h2>
            </div>

            {/* Upload File */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Upload className="h-3.5 w-3.5 text-primary" /> Upload Knowledge
                Source
              </label>
              <div className="rounded-xl border border-dashed border-border/50 p-3 bg-background/20 hover:bg-background/40 transition-all duration-200">
                <UploadForm onUploaded={handleUploaded} />
              </div>
            </div>

            {/* Slider for number of slides */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  Slide Density
                </span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {numSlides} Cards
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Decrease slides"
                  className="h-7 w-7 rounded-md"
                  onClick={handleDecrementSlides}
                  disabled={numSlides <= MIN_PRESENTATION_SLIDES}
                >
                  -
                </Button>
                <input
                  type="range"
                  aria-label="Number of slides"
                  title="Slide density slider"
                  min={MIN_PRESENTATION_SLIDES}
                  max={MAX_PRESENTATION_SLIDES}
                  value={numSlides}
                  onChange={(e) =>
                    setNumSlides(clampSlideCount(Number(e.target.value)))
                  }
                  className="w-full accent-primary h-1 rounded bg-muted cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Increase slides"
                  className="h-7 w-7 rounded-md"
                  onClick={handleIncrementSlides}
                  disabled={numSlides >= MAX_PRESENTATION_SLIDES}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Advanced Settings Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced" className="border-border/30">
                <AccordionTrigger className="text-xs font-semibold text-muted-foreground hover:text-foreground py-2">
                  Advanced Parameters
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Cognitive Engine (Model Selector) */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> Engine
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTextModel("gemini")}
                        className={cn(
                          "relative flex flex-col items-start p-2 rounded-lg border text-left transition-all",
                          textModel === "gemini"
                            ? "border-primary bg-primary/5"
                            : "border-border/40 hover:bg-muted/40",
                        )}
                      >
                        <span className="text-[10px] font-bold">
                          Google Gemini
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextModel("openai")}
                        className={cn(
                          "relative flex flex-col items-start p-2 rounded-lg border text-left transition-all",
                          textModel === "openai"
                            ? "border-primary bg-primary/5"
                            : "border-border/40 hover:bg-muted/40",
                        )}
                      >
                        <span className="text-[10px] font-bold">
                          OpenAI GPT
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Web Search Controls */}
                  <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/30">
                    <span className="text-[10px] font-bold text-foreground flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-sky-500" />
                      Web Search Research
                    </span>
                    <button
                      type="button"
                      aria-label="Toggle web search research"
                      title="Toggle web search research"
                      disabled={isGeneratingOutline}
                      onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50",
                        webSearchEnabled
                          ? "bg-primary"
                          : "bg-muted-foreground/35",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition",
                          webSearchEnabled ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>

                  {/* Selectors Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Language
                      </span>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-full rounded-md text-[10px] h-7 bg-background/40">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Format
                      </span>
                      <Select value={pageStyle} onValueChange={setPageStyle}>
                        <SelectTrigger className="w-full rounded-md text-[10px] h-7 bg-background/40">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Ratio</SelectItem>
                          <SelectItem value="traditional">
                            Traditional
                          </SelectItem>
                          <SelectItem value="tall">Tall Book</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Vibe
                      </span>
                      <Select
                        value={presentationStyle}
                        onValueChange={setPresentationStyle}
                      >
                        <SelectTrigger className="w-full rounded-md text-[10px] h-7 bg-background/40">
                          <SelectValue placeholder="Vibe" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESENTATION_STYLES.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Visuals
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Box 2: Visual Style Swatch Grid */}
          <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md p-4 flex-1 flex flex-col gap-3 min-h-[300px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Brand Systems
                </h2>
              </div>
              <ThemeModal>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-[10px] text-primary"
                >
                  Custom
                </Button>
              </ThemeModal>
            </div>

            {/* Compact Swatch Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-3 gap-2 max-h-[350px] lg:max-h-[none] scrollbar-thin content-start">
              {Object.entries(themes).map(([key, themeOption]) => {
                const isSelected = theme === key;
                const modeColors = isDark
                  ? themeOption.colors.dark
                  : themeOption.colors.light;

                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key as Themes)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all hover:scale-105",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/40 bg-background/20 hover:border-primary/30",
                    )}
                  >
                    <div className="flex -space-x-1">
                      {[
                        modeColors.primary,
                        modeColors.secondary,
                        modeColors.accent,
                      ].map((color, i) => (
                        <div
                          key={i}
                          className="h-3.5 w-3.5 rounded-full ring-1 ring-background"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[9px] font-semibold truncate w-full text-center"
                      style={{ fontFamily: themeOption.fonts.heading }}
                    >
                      {themeOption.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Canvas - Prompt & Outline Grid */}
        <main className="flex-1 flex flex-col gap-6 h-full overflow-y-auto pb-32 lg:pb-16 pr-1 scrollbar-thin">
          {/* Refine Outline Prompt (Top Bar) */}
          <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-md p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-primary" />
              Refine Outline Prompt
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={presentationInput}
                onChange={(e) => setPresentationInput(e.target.value)}
                className="flex-1 rounded-lg border border-border/50 bg-background/55 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/45 transition-all"
                placeholder="Describe your presentation slide deck topic here..."
                disabled={isGeneratingOutline}
              />
              <Button
                type="button"
                onClick={handleGenerateOutline}
                disabled={isGeneratingOutline || !presentationInput.trim()}
                className={cn(
                  "shrink-0 h-10 px-6 font-bold shadow-md",
                  isGeneratingOutline ? "opacity-70" : "hover:shadow-lg",
                )}
              >
                {isGeneratingOutline ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Regenerate Outline
              </Button>
            </div>
          </div>

          {/* Minimalist Cognitive Processing Terminal */}
          <div
            className={cn(
              "rounded-xl border border-border/20 bg-slate-950 shadow-md relative overflow-hidden font-mono transition-all duration-300",
              isGeneratingOutline || outlineThinking ? "p-4" : "p-3 hidden",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Terminal Processing...
                </span>
              </div>
            </div>

            {(isGeneratingOutline || outlineThinking) && (
              <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1 text-[10px] scrollbar-thin border-t border-white/5 pt-3">
                <div className="text-zinc-500 flex gap-1.5">
                  <span>&gt;</span>
                  <span>Active engine: {textModel}</span>
                </div>
                {outlineThinking && (
                  <div className="text-zinc-400 border-l border-primary/30 pl-2 py-0.5 text-[10px] leading-relaxed">
                    <ThinkingDisplay
                      thinking={outlineThinking}
                      isGenerating={isGeneratingOutline}
                      title="AI Thought Stream"
                    />
                  </div>
                )}
                <ToolCallDisplay />
              </div>
            )}
          </div>

          {/* Outline Grid Wrapper */}
          <div className="flex-1">
            <OutlineList />
          </div>
        </main>
      </div>

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
