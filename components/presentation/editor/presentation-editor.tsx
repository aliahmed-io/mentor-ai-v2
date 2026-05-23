"use client";

import debounce from "lodash.debounce";
import type { Value } from "platejs";
import { Plate } from "platejs/react";
import React, { useCallback, useEffect, useState } from "react";
import { usePlateEditor } from "@/components/plate/hooks/usePlateEditor";
import { Editor } from "@/components/plate/ui/editor";
import { TooltipProvider } from "@/components/plate/ui/tooltip";
import { extractFontsFromEditor } from "@/components/plate/utils/extractFontsFromEditor";
import { FontLoader } from "@/components/plate/utils/font-loader";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import "@/styles/presentation.css";
import type { TElement } from "platejs";
import type { PlateNode, PlateSlide } from "../utils/parser";
import ImageGenerationModel from "./custom-elements/image-generation-model";
import RootImage from "./custom-elements/root-image";
import LayoutImageDrop from "./dnd/components/LayoutImageDrop";
import { presentationPlugins } from "./plugins";
import PresentationEditorStaticView from "./presentation-editor-static";

function slideSignature(slide?: PlateSlide): string {
  try {
    return JSON.stringify({
      id: slide?.id,
      content: slide?.content,
      alignment: slide?.alignment,
      layoutType: slide?.layoutType,
      width: slide?.width,
      rootImage: slide?.rootImage,
      bgColor: slide?.bgColor,
      themeStyles: slide?.themeStyles,
    });
  } catch {
    return String(slide?.id ?? "");
  }
}
interface PresentationEditorProps {
  initialContent?: PlateSlide;
  className?: string;
  id?: string;
  autoFocus?: boolean;
  slideIndex: number;
  isGenerating: boolean;
  readOnly?: boolean;
  isPreview?: boolean;
}
// Use React.memo with a custom comparison function to prevent unnecessary re-renders
const PresentationEditor = React.memo(
  ({
    initialContent,
    className,
    id,
    autoFocus = true,
    slideIndex,
    isGenerating = false,
    readOnly = false,
    isPreview = false,
  }: PresentationEditorProps) => {
    const isPresenting = usePresentationState((s) => s.isPresenting);
    const setCurrentSlideIndex = usePresentationState(
      (s) => s.setCurrentSlideIndex,
    );
    const updateSlidePercentages = usePresentationState(
      (s) => s.updateSlidePercentages,
    );
    const editor = usePlateEditor({
      plugins: presentationPlugins,
      value: initialContent?.content ?? ({} as Value),
    });
    const [fontsToLoad, setFontsToLoad] = useState<string[]>([]);

    useEffect(() => {
      if (initialContent) {
        const currentContent = editor.children;
        if (
          JSON.stringify(initialContent.content) !==
          JSON.stringify(currentContent)
        ) {
          requestAnimationFrame(() => {
            editor.tf.setValue(initialContent.content);
          });
        }
      }
    }, [editor, initialContent]);

    const handleSlideChange = useCallback(
      (value: Value, slideIndex: number) => {
        const { slides, setSlides } = usePresentationState.getState();
        const updatedSlides = [...slides];
        // Make sure we have the slide at that index
        if (updatedSlides[slideIndex]) {
          // Update the content of the slide
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            content: value as PlateNode[],
          };

          // Update the global state
          setSlides(updatedSlides);
        }
      },
      [],
    );

    const debouncedOnChange = debounce(
      (value: Value, index: number) => {
        if (isGenerating) return;
        const fontsArray = extractFontsFromEditor(editor);
        setFontsToLoad(fontsArray);
        handleSlideChange(value, index);
      },
      100,
      { maxWait: 200 },
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);

    return (
      <TooltipProvider>
        <div
          className={cn(
            "flex h-full w-full",
            "scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 overflow-hidden p-0 scrollbar-thin scrollbar-track-transparent",
            "relative text-foreground",
            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50",
            className,
            !initialContent?.layoutType && "flex-col",
            initialContent?.layoutType === "background" && "flex-col",
            "presentation-slide",
          )}
          style={{
            ...(initialContent?.themeStyles as React.CSSProperties),
            borderRadius: "var(--presentation-border-radius, 0.5rem)",
            backgroundColor: initialContent?.bgColor || undefined,
            backgroundImage:
              initialContent?.layoutType === "background" &&
              initialContent?.rootImage?.url
                ? `url(${initialContent.rootImage.url})`
                : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          data-is-presenting={readOnly && isPresenting ? "true" : "false"}
          data-slide-content="true"
          data-use-slide-bg={initialContent?.bgColor ? "true" : undefined}
        >
          <FontLoader fontsToLoad={fontsToLoad} />

          {isGenerating ? (
            <PresentationEditorStaticView
              initialContent={initialContent}
              className={className}
              id={id}
            />
          ) : (
            <Plate
              editor={editor}
              onValueChange={({ value }) => {
                if (readOnly || isGenerating || isPresenting) return;

                debouncedOnChange(value, slideIndex);
              }}
              readOnly={isGenerating || readOnly}
            >
              {/* Insert from palette via state */}
              <PaletteInsertionListener />
              {!readOnly && (
                <LayoutImageDrop slideIndex={slideIndex}></LayoutImageDrop>
              )}
              {/* Layout Content Rendering */}
              {(() => {
                const isSplitLayout =
                  initialContent?.rootImage &&
                  initialContent.layoutType !== undefined &&
                  initialContent.layoutType !== "background";

                const editorNode = (
                  <Editor
                    className={cn(
                      className,
                      "flex-1 flex flex-col border-none !bg-transparent py-12 outline-none h-full",
                      (readOnly || isGenerating) && "px-16",
                      !initialContent?.alignment && "justify-center",
                      initialContent?.alignment === "start" && "justify-start",
                      initialContent?.alignment === "center" &&
                        "justify-center",
                      initialContent?.alignment === "end" && "justify-end",
                    )}
                    id={id}
                    autoFocus={autoFocus && !readOnly}
                    variant="ghost"
                    readOnly={isPreview || isGenerating || readOnly}
                    onFocus={() => {
                      if (!readOnly && !isGenerating && !isPresenting) {
                        setCurrentSlideIndex(slideIndex);
                      }
                    }}
                  />
                );

                const rootImageNode = initialContent?.rootImage ? (
                  <RootImage
                    image={initialContent.rootImage}
                    slideIndex={slideIndex}
                    layoutType={initialContent.layoutType}
                    slideId={initialContent.id}
                  />
                ) : null;

                if (isSplitLayout) {
                  const direction =
                    initialContent.layoutType === "vertical"
                      ? "vertical"
                      : "horizontal";

                  // Define the visual order of panels based on layoutType
                  const isImageFirst =
                    initialContent.layoutType === "left" ||
                    initialContent.layoutType === "vertical";

                  const firstPanelNode = isImageFirst
                    ? rootImageNode
                    : editorNode;
                  const secondPanelNode = isImageFirst
                    ? editorNode
                    : rootImageNode;

                  const defaultPercentages =
                    initialContent.layoutPercentages || [50, 50];

                  return (
                    <ResizablePanelGroup
                      direction={direction}
                      className="w-full h-full"
                      onLayout={(sizes) => {
                        updateSlidePercentages(slideIndex, sizes);
                      }}
                    >
                      <ResizablePanel defaultSize={defaultPercentages[0]}>
                        {firstPanelNode}
                      </ResizablePanel>
                      <ResizableHandle withHandle={!readOnly} />
                      <ResizablePanel defaultSize={defaultPercentages[1]}>
                        {secondPanelNode}
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  );
                }

                // Normal layout without splits
                return (
                  <>
                    {editorNode}
                    {rootImageNode}
                  </>
                );
              })()}
              {!readOnly && <ImageGenerationModel></ImageGenerationModel>}
            </Plate>
          )}
        </div>
      </TooltipProvider>
    );
  },
  (prev, next) => {
    // Prevent unnecessary re-renders when parent re-renders or callbacks change.
    // Only re-render when slide-specific props actually change.
    if (prev.id !== next.id) return false;
    // Deep-compare important slide fields using a stable JSON signature
    if (
      slideSignature(prev.initialContent) !==
      slideSignature(next.initialContent)
    ) {
      return false;
    }
    if (prev.readOnly !== next.readOnly) return false;
    if (prev.isPreview !== next.isPreview) return false;
    if (prev.className !== next.className) return false;
    if (prev.isGenerating !== next.isGenerating) return false;
    if (prev.slideIndex !== next.slideIndex) return false;
    // Intentionally ignore function prop identity (onChange) differences
    return true;
  },
);

PresentationEditor.displayName = "PresentationEditor";

export default PresentationEditor;

function PaletteInsertionListener() {
  const { pendingInsertNode, setPendingInsertNode } = usePresentationState();
  const editor = usePlateEditor({ id: "presentation" });
  useEffect(() => {
    if (!pendingInsertNode || !editor) return;
    try {
      const elem = pendingInsertNode as unknown as TElement;
      editor.tf.insertNodes(elem);
    } finally {
      setPendingInsertNode(null);
    }
  }, [pendingInsertNode, editor, setPendingInsertNode]);
  return null;
}
