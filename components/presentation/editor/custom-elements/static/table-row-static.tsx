import { SlateElement, type SlateElementProps } from "platejs";
import { cn } from "@/lib/utils";

export function TableRowStatic(props: SlateElementProps) {
  return (
    <div className={cn("grid auto-cols-fr grid-flow-col items-stretch gap-2")}>
      <SlateElement {...props}>{props.children}</SlateElement>
    </div>
  );
}
