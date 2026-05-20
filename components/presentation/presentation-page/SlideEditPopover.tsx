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
  Trash2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  mergeRegeneratedSlide,
  regenerateSlideFromApi,
} from "@/lib/presentation/regenerate-slide-client";
import { Button } from "@/components/ui/button";
import ColorPicker from "@/components/ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
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
    // For demo purposes, just set a placeholder image
    // In production, this would open an image selector
    updateSlide({
      rootImage: {
        query: "placeholder image",
        url: "https://placehold.co/600x400",
      },
    });
    alert("This would open the image selector in production");
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
        className="w-80 rounded-md border border-border bg-background"
        side="bottom"
      >
        <div className="space-y-2">
          {/* Card Color */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-current" />
              <span className="text-sm text-zinc-200">Card color</span>
            </div>
            <ColorPicker
              value={currentBgColor}
              onChange={(color) => updateSlide({ bgColor: color })}
            />
          </div>
          {/* Accent Image */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4" />
              <span className="text-sm text-zinc-200">Accent image</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-blue-500"
                onClick={handleImageEdit}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500"
                onClick={handleImageDelete}
                disabled={!hasRootImage}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Content Alignment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlignCenter className="h-4 w-4"></AlignCenter>
              <span className="text-sm text-zinc-200">Content alignment</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentAlignment === "start" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ alignment: "start" })}
              >
                <ArrowUpFromLine className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentAlignment === "center" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ alignment: "center" })}
              >
                <FoldVertical className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentAlignment === "end" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ alignment: "end" })}
              >
                <ArrowUpFromLine className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Image Placement */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm text-zinc-200">Card layout</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentLayout === "vertical" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ layoutType: "vertical" })}
              >
                <PanelTop className="h-4 w-4"></PanelTop>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentLayout === "left" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ layoutType: "left" })}
              >
                <PanelLeft className="h-4 w-4"></PanelLeft>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentLayout === "right" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ layoutType: "right" })}
              >
                <PanelRight className="h-4 w-4"></PanelRight>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentLayout === "background" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ layoutType: "background" })}
              >
                <ImageIcon className="h-4 w-4"></ImageIcon>
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-zinc-200">AI Copilot</span>
              </div>
              <Textarea 
                placeholder="e.g., Turn this into a timeline..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="text-xs h-16 resize-none bg-zinc-900 border-zinc-800"
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
              className="w-full gap-2 border-zinc-800"
              disabled={isRegenerating}
              onClick={() => void handleRegenerateLayout()}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRegenerating && "animate-spin")}
              />
              {isRegenerating ? "Regenerating…" : "Regenerate layout"}
            </Button>
          </div>

          {/* Card Width */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoveHorizontal className="h-4 w-4"></MoveHorizontal>
              <span className="text-sm text-zinc-200">Card width</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-zinc-800 bg-zinc-900 px-2",
                  currentWidth === "S" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ width: "S" })}
              >
                S
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-zinc-800 bg-zinc-900 px-2",
                  currentWidth === "M" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ width: "M" })}
              >
                M
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-zinc-800 bg-zinc-900 px-2",
                  currentWidth === "L" && "bg-blue-600",
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
