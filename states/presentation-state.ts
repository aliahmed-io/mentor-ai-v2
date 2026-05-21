import type { TElement } from "platejs";
import { create } from "zustand";
import type { ImageModelList } from "@/app/_actions/image/generate";
import type { PlateSlide } from "@/components/presentation/utils/parser";
import type { ThemeProperties, Themes } from "@/lib/presentation/themes";

export type GenerationStatus =
  | "idle"
  | "generating_outline"
  | "outline_completed"
  | "generating_slides"
  | "slides_completed"
  | "failed";

interface PresentationState {
  currentPresentationId: string | null;
  currentPresentationTitle: string | null;
  isGridView: boolean;
  isSheetOpen: boolean;
  numSlides: number;
  textModel: "gemini" | "openai" | "quality";

  viewMode: "slides" | "web";
  setViewMode: (mode: "slides" | "web") => void;

  theme: Themes | string;
  customThemeData: ThemeProperties | null;
  language: string;
  pageStyle: string;
  showTemplates: boolean;
  presentationInput: string;
  imageModel: ImageModelList;
  imageSource: "ai" | "stock";
  stockImageProvider: "unsplash";
  presentationStyle: string;
  presentationColorMode: "light" | "dark";
  setPresentationColorMode: (mode: "light" | "dark") => void;
  savingStatus: "idle" | "saving" | "saved";
  isPresenting: boolean;
  currentSlideIndex: number;
  isThemeCreatorOpen: boolean;

  config: Record<string, unknown>;
  setConfig: (config: Record<string, unknown>) => void;
  // Generation states
  generationStatus: GenerationStatus;
  setGenerationStatus: (status: GenerationStatus) => void;
  generationProgress: { current: number; total: number } | null;
  setGenerationProgress: (
    progress: { current: number; total: number } | null,
  ) => void;
  // Serial Image queue
  imageQueue: Array<{ slideId: string; query: string }>;
  pushImageToQueue: (slideId: string, query: string) => void;
  popImageFromQueue: () => { slideId: string; query: string } | null;

  shouldStartOutlineGeneration: boolean;
  shouldStartPresentationGeneration: boolean;
  isGeneratingOutline: boolean;
  isGeneratingPresentation: boolean;
  outline: string[];
  searchResults: Array<{ query: string; results: unknown[] }>; // Store search results for context
  webSearchEnabled: boolean; // Toggle for web search in outline generation
  slides: PlateSlide[]; // This now holds the new object structure

  // Thinking content from AI responses
  outlineThinking: string; // Thinking content from outline generation
  presentationThinking: string; // Thinking content from presentation generation

  // Root image generation tracking by slideId
  rootImageGeneration: Record<
    string,
    {
      query: string;
      status: "pending" | "success" | "error";
      url?: string;
      error?: string;
    }
  >;

  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (update: boolean) => void;
  isRightPanelCollapsed: boolean;
  setIsRightPanelCollapsed: (update: boolean) => void;
  setSlides: (slides: PlateSlide[]) => void;
  startRootImageGeneration: (slideId: string, query: string) => void;
  completeRootImageGeneration: (slideId: string, url: string) => void;
  failRootImageGeneration: (slideId: string, error: string) => void;
  clearRootImageGeneration: (slideId: string) => void;
  setCurrentPresentation: (id: string | null, title: string | null) => void;
  setIsGridView: (isGrid: boolean) => void;
  setIsSheetOpen: (isOpen: boolean) => void;
  setNumSlides: (num: number) => void;
  setTheme: (
    theme: Themes | string,
    customData?: ThemeProperties | null,
  ) => void;
  shouldShowExitHeader: boolean;
  setShouldShowExitHeader: (udpdate: boolean) => void;
  thumbnailUrl?: string;
  setThumbnailUrl: (url: string | undefined) => void;
  setLanguage: (lang: string) => void;
  setTextModel: (model: "gemini" | "openai" | "quality") => void;
  setPageStyle: (style: string) => void;
  setShowTemplates: (show: boolean) => void;
  setPresentationInput: (input: string) => void;
  setOutline: (topics: string[]) => void;
  setSearchResults: (
    results: Array<{ query: string; results: unknown[] }>,
  ) => void;
  setOutlineThinking: (thinking: string) => void;
  setPresentationThinking: (thinking: string) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  setImageModel: (model: ImageModelList) => void;
  setImageSource: (source: "ai" | "stock") => void;
  setStockImageProvider: (provider: "unsplash") => void;
  setPresentationStyle: (style: string) => void;
  setSavingStatus: (status: "idle" | "saving" | "saved") => void;
  setIsPresenting: (isPresenting: boolean) => void;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;

  setIsThemeCreatorOpen: (update: boolean) => void;
  // Generation actions
  setShouldStartOutlineGeneration: (shouldStart: boolean) => void;
  setShouldStartPresentationGeneration: (shouldStart: boolean) => void;
  setIsGeneratingOutline: (isGenerating: boolean) => void;
  setIsGeneratingPresentation: (isGenerating: boolean) => void;
  startOutlineGeneration: () => void;
  startPresentationGeneration: () => void;
  resetGeneration: () => void;
  resetForNewGeneration: () => void;

  // Selection state
  isSelecting: boolean;
  selectedPresentations: string[];
  toggleSelecting: () => void;
  selectAllPresentations: (ids: string[]) => void;
  deselectAllPresentations: () => void;
  togglePresentationSelection: (id: string) => void;

  // Palette → Editor communication
  pendingInsertNode: TElement | null;
  setPendingInsertNode: (node: TElement | null) => void;
}

export const usePresentationState = create<PresentationState>((set) => ({
  currentPresentationId: null,
  currentPresentationTitle: null,
  isGridView: true,
  isSheetOpen: false,
  shouldShowExitHeader: false,
  setShouldShowExitHeader: (update) => set({ shouldShowExitHeader: update }),
  thumbnailUrl: undefined,
  setThumbnailUrl: (url) => set({ thumbnailUrl: url }),
  numSlides: 5,
  language: "en-US",
  textModel: "gemini",
  pageStyle: "default",
  showTemplates: false,
  presentationInput: "",
  outline: [],
  searchResults: [],
  webSearchEnabled: false,
  viewMode: "slides",
  theme: "mystique",
  customThemeData: null,
  imageModel: "gemini-3.1-flash-image-preview",
  imageSource: "stock",
  stockImageProvider: "unsplash",
  presentationStyle: "professional",
  presentationColorMode: "dark",
  slides: [], // Now holds the new slide object structure
  outlineThinking: "",
  presentationThinking: "",
  rootImageGeneration: {},
  savingStatus: "idle",
  isPresenting: false,
  currentSlideIndex: 0,
  isThemeCreatorOpen: false,
  config: {},
  pendingInsertNode: null,

  // Sidebar states
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: (update) => set({ isSidebarCollapsed: update }),
  isRightPanelCollapsed: false,
  setIsRightPanelCollapsed: (update) => set({ isRightPanelCollapsed: update }),

  // Generation states
  generationStatus: "idle",
  setGenerationStatus: (status) =>
    set({
      generationStatus: status,
      isGeneratingOutline: status === "generating_outline",
      isGeneratingPresentation: status === "generating_slides",
    }),
  generationProgress: null,
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  imageQueue: [],
  pushImageToQueue: (slideId, query) =>
    set((state) => ({
      imageQueue: [...state.imageQueue, { slideId, query }],
    })),
  popImageFromQueue: () => {
    let popped: { slideId: string; query: string } | null = null;
    set((state) => {
      if (state.imageQueue.length > 0) {
        const [head, ...tail] = state.imageQueue;
        popped = head || null;
        return { imageQueue: tail };
      }
      return {};
    });
    return popped;
  },

  shouldStartOutlineGeneration: false,
  shouldStartPresentationGeneration: false,
  isGeneratingOutline: false,
  isGeneratingPresentation: false,

  setSlides: (slides) => {
    set({ slides });
  },
  setPendingInsertNode: (node) => set({ pendingInsertNode: node }),
  setConfig: (config) => set({ config }),
  startRootImageGeneration: (slideId, query) =>
    set((state) => ({
      rootImageGeneration: {
        ...state.rootImageGeneration,
        [slideId]: { query, status: "pending" },
      },
    })),
  completeRootImageGeneration: (slideId, url) =>
    set((state) => ({
      rootImageGeneration: {
        ...state.rootImageGeneration,
        [slideId]: {
          ...(state.rootImageGeneration[slideId] ?? { query: "" }),
          status: "success",
          url,
        },
      },
    })),
  failRootImageGeneration: (slideId, error) =>
    set((state) => ({
      rootImageGeneration: {
        ...state.rootImageGeneration,
        [slideId]: {
          ...(state.rootImageGeneration[slideId] ?? { query: "" }),
          status: "error",
          error,
        },
      },
    })),
  clearRootImageGeneration: (slideId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [slideId]: _removed, ...rest } = state.rootImageGeneration;
      return { rootImageGeneration: rest } as Partial<PresentationState>;
    }),
  setCurrentPresentation: (id, title) =>
    set({ currentPresentationId: id, currentPresentationTitle: title }),
  setIsGridView: (isGrid) => set({ isGridView: isGrid }),
  setIsSheetOpen: (isOpen) => set({ isSheetOpen: isOpen }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setNumSlides: (num) => set({ numSlides: num }),
  setLanguage: (lang) => set({ language: lang }),
  setTextModel: (model) => set({ textModel: model }),
  setTheme: (theme, customData = null) =>
    set({
      theme: theme,
      customThemeData: customData,
    }),
  setPageStyle: (style) => set({ pageStyle: style }),
  setShowTemplates: (show) => set({ showTemplates: show }),
  setPresentationInput: (input) => set({ presentationInput: input }),
  setOutline: (topics) => set({ outline: topics }),
  setSearchResults: (results) => set({ searchResults: results }),
  setOutlineThinking: (thinking) => set({ outlineThinking: thinking }),
  setPresentationThinking: (thinking) =>
    set({ presentationThinking: thinking }),
  setWebSearchEnabled: (enabled) => set({ webSearchEnabled: enabled }),
  setImageModel: (model) => set({ imageModel: model }),
  setImageSource: (source) => set({ imageSource: source }),
  setStockImageProvider: (provider) => set({ stockImageProvider: provider }),
  setPresentationColorMode: (mode) => set({ presentationColorMode: mode }),
  setPresentationStyle: (style) => set({ presentationStyle: style }),
  setSavingStatus: (status) => set({ savingStatus: status }),
  setIsPresenting: (isPresenting) => set({ isPresenting }),
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
  nextSlide: () =>
    set((state) => ({
      currentSlideIndex: Math.min(
        state.currentSlideIndex + 1,
        state.slides.length - 1,
      ),
    })),
  previousSlide: () =>
    set((state) => ({
      currentSlideIndex: Math.max(state.currentSlideIndex - 1, 0),
    })),

  // Generation actions
  setShouldStartOutlineGeneration: (shouldStart) =>
    set({ shouldStartOutlineGeneration: shouldStart }),
  setShouldStartPresentationGeneration: (shouldStart) =>
    set({ shouldStartPresentationGeneration: shouldStart }),
  setIsGeneratingOutline: (isGenerating) =>
    set((state) => {
      const nextStatus = isGenerating ? "generating_outline" : "idle";
      return {
        isGeneratingOutline: isGenerating,
        generationStatus:
          state.generationStatus === "generating_outline" && !isGenerating
            ? "outline_completed"
            : nextStatus,
      };
    }),
  setIsGeneratingPresentation: (isGenerating) =>
    set((state) => {
      const nextStatus = isGenerating ? "generating_slides" : "idle";
      return {
        isGeneratingPresentation: isGenerating,
        generationStatus:
          state.generationStatus === "generating_slides" && !isGenerating
            ? "slides_completed"
            : nextStatus,
      };
    }),
  startOutlineGeneration: () =>
    set({
      shouldStartOutlineGeneration: true,
      isGeneratingOutline: true,
      shouldStartPresentationGeneration: false,
      isGeneratingPresentation: false,
      outline: [],
      generationStatus: "generating_outline",
    }),
  startPresentationGeneration: () =>
    set({
      shouldStartPresentationGeneration: true,
      isGeneratingPresentation: true,
      generationStatus: "generating_slides",
    }),
  resetGeneration: () =>
    set({
      shouldStartOutlineGeneration: false,
      shouldStartPresentationGeneration: false,
      isGeneratingOutline: false,
      isGeneratingPresentation: false,
      searchResults: [],
      generationStatus: "idle",
      generationProgress: null,
      imageQueue: [],
    }),

  // Reset everything except ID and current input when starting new outline generation
  resetForNewGeneration: () =>
    set(() => ({
      thumbnailUrl: undefined,
      outline: [],
      searchResults: [],
      slides: [],
      outlineThinking: "",
      presentationThinking: "",
      rootImageGeneration: {},
      imageQueue: [],
      generationProgress: null,
    })),

  setIsThemeCreatorOpen: (update) => set({ isThemeCreatorOpen: update }),
  // Selection state
  isSelecting: false,
  selectedPresentations: [],
  toggleSelecting: () =>
    set((state) => ({
      isSelecting: !state.isSelecting,
      selectedPresentations: [],
    })),
  selectAllPresentations: (ids) => set({ selectedPresentations: ids }),
  deselectAllPresentations: () => set({ selectedPresentations: [] }),
  togglePresentationSelection: (id) =>
    set((state) => ({
      selectedPresentations: state.selectedPresentations.includes(id)
        ? state.selectedPresentations.filter((p) => p !== id)
        : [...state.selectedPresentations, id],
    })),
}));
