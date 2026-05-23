"use client";
import { createSlateEditor, type Value } from "platejs";
import React, { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import type { PlateSlide } from "../utils/parser";
import { EditorStatic } from "./custom-elements/static/editor-static";
import RootImageStatic from "./custom-elements/static/root-image-static";
import { PresentationEditorBaseKit } from "./plugins/presentation-editor-base-kit";
import { PresentationStaticCustomKit } from "./plugins/static-custom-kit";
import { PresentationStaticComponents } from "./plugins/static-kit";

interface PresentationEditorStaticViewProps {
  initialContent?: PlateSlide;
  className?: string;
  id?: string;
}

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

const PresentationEditorStaticView = React.memo(
  ({ initialContent, className, id }: PresentationEditorStaticViewProps) => {
    const { isPresenting } = usePresentationState();
    const editor = useMemo(
      () =>
        createSlateEditor({
          plugins: [
            ...PresentationEditorBaseKit,
            ...PresentationStaticCustomKit,
          ],
          components: PresentationStaticComponents,
          value: initialContent?.content ?? ([] as Value),
        }),
      [initialContent?.content],
    );

    // Keep value in sync without recreating editor
    useEffect(() => {
      if (!initialContent?.content) return;
      editor.tf.setValue(initialContent.content);
    }, [editor, initialContent?.content]);

    return (
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
        data-is-presenting={isPresenting ? "true" : "false"}
        data-slide-content="true"
        data-use-slide-bg={initialContent?.bgColor ? "true" : undefined}
      >
        {(() => {
          const isSplitLayout =
            initialContent?.rootImage &&
            initialContent.layoutType !== undefined &&
            initialContent.layoutType !== "background";

          const editorNode = (
            <EditorStatic
              className={cn(
                className,
                "flex flex-col border-none !bg-transparent p-12 outline-none h-full",
                !isSplitLayout && "flex-1",
                initialContent?.alignment === "start" && "justify-start",
                initialContent?.alignment === "center" && "justify-center",
                initialContent?.alignment === "end" && "justify-end",
              )}
              id={id}
              editor={editor}
            />
          );

          const rootImageNode = initialContent?.rootImage ? (
            <div
              className={cn(
                "relative overflow-hidden",
                !isSplitLayout && "flex-1",
              )}
            >
              <RootImageStatic
                image={initialContent.rootImage}
                layoutType={initialContent.layoutType}
                slideId={initialContent.id}
              />
            </div>
          ) : null;

          if (isSplitLayout) {
            const isImageFirst =
              initialContent.layoutType === "left" ||
              initialContent.layoutType === "vertical";

            const defaultPercentages = initialContent.layoutPercentages || [
              50, 50,
            ];

            const firstFlex = defaultPercentages[0];
            const secondFlex = defaultPercentages[1];

            const firstPanelStyle = { flex: `${firstFlex} ${firstFlex} 0%` };
            const secondPanelStyle = { flex: `${secondFlex} ${secondFlex} 0%` };

            const isVertical = initialContent.layoutType === "vertical";

            return (
              <div
                className={cn(
                  "flex h-full w-full",
                  isVertical ? "flex-col" : "flex-row",
                )}
              >
                <div
                  style={firstPanelStyle}
                  className="h-full relative overflow-hidden"
                >
                  {isImageFirst ? rootImageNode : editorNode}
                </div>
                <div
                  style={secondPanelStyle}
                  className="h-full relative overflow-hidden"
                >
                  {isImageFirst ? editorNode : rootImageNode}
                </div>
              </div>
            );
          }

          return (
            <>
              {editorNode}
              {rootImageNode}
            </>
          );
        })()}
      </div>
    );
  },
  (prev, next) => {
    if (prev.id !== next.id) return false;
    if (
      slideSignature(prev.initialContent) !==
      slideSignature(next.initialContent)
    )
      return false;
    if (prev.className !== next.className) return false;
    return true;
  },
);

export default PresentationEditorStaticView;
