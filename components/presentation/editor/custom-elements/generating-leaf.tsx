"use client";

import { PlateLeaf, type PlateLeafProps } from "platejs/react";
import { usePresentationState } from "@/states/presentation-state";

export const GeneratingLeaf = ({ children, ref, ...props }: PlateLeafProps) => {
  const { leaf } = props;
  const { isGeneratingPresentation } = usePresentationState();
  const isGenerating = isGeneratingPresentation && (leaf.generating as boolean);

  return (
    <PlateLeaf ref={ref} {...props}>
      <span className="flex items-end gap-1">
        {children}
        {isGenerating && (
          <div
            style={{
              color: "var(--presentation-text , black) !important",
              backgroundColor: "var(--presentation-text , black) !important",
            }}
            className="animate-blink z-[1000] max-h-8"
          >
            |
          </div>
        )}
      </span>
    </PlateLeaf>
  );
};
