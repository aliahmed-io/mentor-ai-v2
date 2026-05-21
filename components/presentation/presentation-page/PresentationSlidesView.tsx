"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlateController } from "platejs/react";
import { useEffect } from "react";
import { SlideContainer } from "@/components/presentation/presentation-page/SlideContainer";
import { usePresentationSlides } from "@/hooks/presentation/usePresentationSlides";
import { useSlideChangeWatcher } from "@/hooks/presentation/useSlideChangeWatcher";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { PresentModeHeader } from "../dashboard/PresentModeHeader";
import { ThinkingDisplay } from "../dashboard/ThinkingDisplay";
import PresentationEditor from "../editor/presentation-editor";
import { GlobalUndoRedoHandler } from "./GlobalUndoRedoHandler";

interface PresentationSlidesViewProps {
  isGeneratingPresentation: boolean;
}

export const PresentationSlidesView = ({
  isGeneratingPresentation,
}: PresentationSlidesViewProps) => {
  const currentSlideIndex = usePresentationState((s) => s.currentSlideIndex);
  const isPresenting = usePresentationState((s) => s.isPresenting);
  const viewMode = usePresentationState((s) => s.viewMode);
  const nextSlide = usePresentationState((s) => s.nextSlide);
  const previousSlide = usePresentationState((s) => s.previousSlide);
  const setShouldShowExitHeader = usePresentationState(
    (s) => s.setShouldShowExitHeader,
  );
  const currentPresentationTitle = usePresentationState(
    (s) => s.currentPresentationTitle,
  );
  const shouldShowExitHeader = usePresentationState(
    (s) => s.shouldShowExitHeader,
  );
  const { items, sensors, handleDragEnd } = usePresentationSlides();
  // Use the slide change watcher to automatically save changes
  useSlideChangeWatcher({ debounceDelay: 600 });
  // Handle keyboard navigation in presentation mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPresenting) return;
      if (event.key === "ArrowRight" || event.key === "Space") {
        nextSlide();
      } else if (event.key === "ArrowLeft") {
        previousSlide();
      } else if (event.key === "Escape") {
        usePresentationState.getState().setIsPresenting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, previousSlide, isPresenting]);

  // Handle showing header on mouse move
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPresenting) return; // Only show header when in presentation mode

      if (event.clientY < 100) {
        setShouldShowExitHeader(true);
      } else {
        setShouldShowExitHeader(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPresenting, setShouldShowExitHeader]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <PresentModeHeader
          presentationTitle={currentPresentationTitle || ""}
          showHeader={isPresenting && shouldShowExitHeader}
        />

        <ThinkingDisplay
          thinking={usePresentationState.getState().presentationThinking}
          isGenerating={isGeneratingPresentation}
          progress={usePresentationState.getState().generationProgress}
          title="AI is generating your slides..."
        />

        <PlateController>
          <GlobalUndoRedoHandler />

          <div
            className={cn(
              "slides-view-container mx-auto w-full",
              viewMode === "web" && !isPresenting
                ? "flex flex-col gap-0 max-w-4xl py-12"
                : "max-w-5xl",
            )}
          >
            {items.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  `slide-wrapper slide-wrapper-${index} w-full`,
                  viewMode === "web" &&
                    !isPresenting &&
                    "border-b border-muted/20 last:border-0",
                )}
              >
                <SlideContainer
                  index={index}
                  id={slide.id}
                  slideWidth={slide.width}
                  slidesCount={items.length}
                  className={
                    viewMode === "web" && !isPresenting ? "min-h-[60vh]" : ""
                  }
                >
                  <div
                    className={cn(
                      `slide-container-${index}`,
                      isPresenting ? "h-screen w-screen" : "h-full w-full",
                      !isPresenting &&
                        "animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both",
                    )}
                    style={
                      !isPresenting
                        ? { animationDelay: `${Math.min(index * 100, 1000)}ms` }
                        : undefined
                    }
                  >
                    <PresentationEditor
                      initialContent={slide}
                      className={cn(
                        "h-full w-full border-none",
                        isPresenting && "h-screen w-screen",
                      )}
                      id={slide.id}
                      autoFocus={index === currentSlideIndex}
                      slideIndex={index}
                      isGenerating={isGeneratingPresentation}
                      readOnly={isPresenting}
                    />
                  </div>
                </SlideContainer>
              </div>
            ))}
          </div>
        </PlateController>
      </SortableContext>
    </DndContext>
  );
};
