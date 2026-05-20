import { SlateElement, type SlateElementProps } from "platejs";
import { cn } from "@/lib/utils";

export default function ProsConsGroupStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div className={cn("grid gap-6 md:grid-cols-2")}>{props.children}</div>
    </SlateElement>
  );
}
