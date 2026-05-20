"use client";

import { PlateElement, type StyledPlateElementProps } from "platejs/react";
import { cn } from "@/lib/utils";

export const PresentationElement = ({
  children,
  ref,
  className,
  ...props
}: StyledPlateElementProps) => {
  return (
    <PlateElement
      ref={ref}
      className={cn("presentation-element relative !select-text", className)}
      {...props}
    >
      {children}
    </PlateElement>
  );
};

PresentationElement.displayName = "PresentationElement";
