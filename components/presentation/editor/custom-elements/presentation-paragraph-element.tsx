"use client";

import { PlateElement, withRef } from "platejs/react";
import type React from "react";
import { cn } from "@/lib/utils";

export interface PresentationParagraphElementProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const PresentationParagraphElement = withRef<
  typeof PlateElement,
  PresentationParagraphElementProps
>(({ className, children, as: _as, ...props }, ref) => {
  return (
    <PlateElement
      ref={ref}
      {...(props as any)}
      as="div"
      className={cn(
        "presentation-paragraph m-0 px-0 py-1 text-base",
        className,
      )}
    >
      {children}
    </PlateElement>
  );
});

PresentationParagraphElement.displayName = "PresentationParagraphElement";
