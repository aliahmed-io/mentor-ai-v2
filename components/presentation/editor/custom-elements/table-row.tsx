"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";
import { cn } from "@/lib/utils";

export const TableRow = (props: PlateElementProps) => {
  return (
    <div className={cn("grid auto-cols-fr grid-flow-col items-stretch gap-2")}>
      <PlateElement {...props}>{props.children}</PlateElement>
    </div>
  );
};
