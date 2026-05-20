"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";
import { cn } from "@/lib/utils";

export const ProsItem = (props: PlateElementProps) => {
  return (
    <div
      className={cn("flex h-full flex-col rounded-lg p-6 text-white")}
      style={{
        background: "linear-gradient(135deg, #27ae60 0%, #229954 100%)",
      }}
    >
      <PlateElement {...props} className={cn("flex-1")}>
        {props.children}
      </PlateElement>
    </div>
  );
};
