"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";
import { cn } from "@/lib/utils";

export const TableCell = (props: PlateElementProps) => {
  return (
    <div
      className={cn("rounded border bg-card p-3 text-sm")}
      style={{
        backgroundColor: "var(--presentation-background)",
        color: "var(--presentation-text)",
        borderColor: "hsl(var(--border))",
      }}
    >
      <PlateElement {...props}>{props.children}</PlateElement>
    </div>
  );
};
