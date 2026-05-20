import {
  AlignCenter,
  ArrowUpFromLine,
  Edit,
  FoldVertical,
  Image,
  ImageIcon,
  LayoutGrid,
  MoveHorizontal,
  PanelLeft,
  PanelRight,
  PanelTop,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ColorPicker from "@/components/ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  mergeRegeneratedSlide,
  regenerateSlideFromApi,
} from "@/lib/presentation/regenerate-slide-client";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import type { LayoutType } from "../utils/parser";

interface SlideEditPopoverProps {
  index: number;
}

type ContentAlignment = "start" | "center" | "end";

export function SlideEditPopover({ index }: SlideEditPopoverProps) {
  const {
    slides,
    setSlides,
    outline,
    presentationInput,
    currentPresentationTitle,
    language,
    presentationStyle,
    textModel,
    searchResults,
    theme,
    customThemeData,
    presentationColorMode,
    config,
    startRootImageGeneration,
    pushImageToQueue,
  } = usePresentationState();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const updateSlide = (
    updates: Partial<{
      layoutType: LayoutType;
      bgColor: string;
      width: "S" | "M" | "L";
      alignment: ContentAlignment;
      rootImage?: {
        query: string;
        url?: string;
      };
    }>,
  ) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = {
      ...updatedSlides[index]!,
      ...updates,
    };
    setSlides(updatedSlides);
  };

  const currentSlide = slides[index];
  const currentLayout = currentSlide?.layoutType ?? "left";
  const currentBgColor = currentSlide?.bgColor ?? "#4D4D4D";
  const currentWidth = currentSlide?.width ?? "M";
  const currentAlignment = currentSlide?.alignment ?? "start";
  const hasRootImage = !!currentSlide?.rootImage;

  const handleImageEdit = () => {
    // In production, this would open an image selector
    toast.info("Image selector feature coming soon.");
  };

  const handleImageDelete = () => {
    updateSlide({ rootImage: { ...currentSlide?.rootImage!, url: undefined } });
  };

  const handleRegenerateLayout = async (overridePrompt?: string) => {
    const outlineItem = outline[index];
    if (!outlineItem) {
      toast.error("No outline topic for this slide");
      return;
    }
    setIsRegenerating(true);
    try {
      const promptToUse = overridePrompt?.trim()
        ? `[USER EDIT INSTRUCTION: ${overridePrompt.trim()}] Original context: ${presentationInput}`
        : presentationInput;

      const newSlide = await regenerateSlideFromApi({
        slideIndex: index,
        outlineItem,
        title: currentPresentationTitle ?? presentationInput ?? "Presentation",
        prompt: promptToUse,
        outline,
        language,
        tone: presentationStyle,
        textModel,
        searchResults,
      });
      if (!newSlide) throw new Error("No slide returned");
      const typography = config.typography as
        | { heading?: string; body?: string }
        | undefined;
      setSlides(
        mergeRegeneratedSlide(
          slides,
          index,
          newSlide,
          typeof theme === "string" ? theme : "mystique",
          presentationColorMode,
          customThemeData,
          typography,
        ),
      );

      // Re-queue the root image if the new layout requests one
      if (newSlide.rootImage?.query && !newSlide.rootImage.url) {
        startRootImageGeneration(newSlide.id, newSlide.rootImage.query);
        pushImageToQueue(newSlide.id, newSlide.rootImage.query);
      }

      toast.success("Slide layout regenerated");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to regenerate slide",
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="!size-8 rounded-full">
          <Edit className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-2xl border border-[#dcd7cd] bg-[#fdfcfb] p-5 shadow-xl text-[#221f1c]"
        side="bottom"
      >
        <div className="space-y-4">
          {/* Card Color */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#221f1c]">
              <div className="h-4 w-4 rounded-full border border-[#dcd7cd] bg-current" />
              <span className="text-sm font-medium">Card color</span>
            </div>
            <ColorPicker
              value={currentBgColor}
              onChange={(color) => updateSlide({ bgColor: color })}
            />
          </div>

          {/* Accent Image */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#221f1c]">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4 text-[#696257]" />
              <span className="text-sm font-medium">Accent image</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-[#5a8b67] hover:text-[#4d7556] hover:underline font-semibold"
                onClick={handleImageEdit}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-[#bd4a4a] hover:bg-[#bd4a4a]/10 hover:text-[#bd4a4a]"
                onClick={handleImageDelete}
                disabled={!hasRootImage}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Alignment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#221f1c]">
              <AlignCenter className="h-4 w-4 text-[#696257]"></AlignCenter>
              <span className="text-sm font-medium">Content alignment</span>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all",
                  currentAlignment === "start" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ alignment: "start" })}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all",
                  currentAlignment === "center" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ alignment: "center" })}
              >
                <FoldVertical className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all",
                  currentAlignment === "end" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ alignment: "end" })}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </div>
          </div>

          {/* Card Layout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#221f1c]">
              <LayoutGrid className="h-4 w-4 text-[#696257]" />
              <span className="text-sm font-medium">Card layout</span>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all",
                  currentLayout === "vertical" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ layoutType: "vertical" })}
              >
                <PanelTop className="h-4 w-4"></PanelTop>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all",
                  currentLayout === "left" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ layoutType: "left" })}
              >
                <PanelLeft className="h-4 w-4"></PanelLeft>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all",
                  currentLayout === "right" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ layoutType: "right" })}
              >
                <PanelRight className="h-4 w-4"></PanelRight>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all",
                  currentLayout === "background" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ layoutType: "background" })}
              >
                <ImageIcon className="h-4 w-4"></ImageIcon>
              </Button>
            </div>
          </div>

          {/* AI Copilot */}
          <div className="pt-3 border-t border-[#e6e2d8] space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#221f1c]">
                <Sparkles className="h-4 w-4 text-[#5a8b67]" />
                <span className="text-sm font-semibold">AI Copilot</span>
              </div>
              <Textarea
                placeholder="e.g., Turn this into a timeline..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full rounded-xl border border-[#dcd7cd] bg-[#fbfaf8] p-3 text-xs text-[#221f1c] placeholder-[#8c8273] focus:border-[#96c8a2] focus:ring-1 focus:ring-[#96c8a2] transition-all min-h-[72px] resize-none"
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-full h-9 rounded-full bg-[#96c8a2] hover:bg-[#85b991] text-[#101612] font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                disabled={isRegenerating || !customPrompt.trim()}
                onClick={() => void handleRegenerateLayout(customPrompt)}
              >
                {isRegenerating ? "Applying..." : "Apply Edit"}
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-full border border-[#dcd7cd] bg-transparent hover:bg-[#e6e2d8]/30 text-[#221f1c] font-semibold transition-all flex items-center justify-center gap-2"
              disabled={isRegenerating}
              onClick={() => void handleRegenerateLayout()}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 text-[#696257]",
                  isRegenerating && "animate-spin",
                )}
              />
              {isRegenerating ? "Regenerating…" : "Regenerate layout"}
            </Button>
          </div>

          {/* Card Width */}
          <div className="pt-2 border-t border-[#e6e2d8] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#221f1c]">
              <MoveHorizontal className="h-4 w-4 text-[#696257]"></MoveHorizontal>
              <span className="text-sm font-medium">Card width</span>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all font-bold text-xs flex items-center justify-center",
                  currentWidth === "S" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ width: "S" })}
              >
                S
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all font-bold text-xs flex items-center justify-center",
                  currentWidth === "M" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ width: "M" })}
              >
                M
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 rounded-full border border-[#dcd7cd] bg-[#e6e2d8]/40 text-[#221f1c] hover:bg-[#e6e2d8]/80 transition-all font-bold text-xs flex items-center justify-center",
                  currentWidth === "L" &&
                    "bg-[#96c8a2] text-[#101612] hover:bg-[#85b991] border-[#85b991] shadow-sm",
                )}
                onClick={() => updateSlide({ width: "L" })}
              >
                L
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
