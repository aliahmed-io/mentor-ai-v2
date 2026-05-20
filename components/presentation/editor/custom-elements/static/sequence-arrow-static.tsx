import { SlateElement, type SlateElementProps } from "platejs";
import { cn } from "@/lib/utils";

export default function ArrowVerticalStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div
        className={cn(
          "[&_:is(.presentation-heading)]:[-webkit-background-clip:unset!important;]",
          "[&_:is(.presentation-heading)]:[-webkit-text-fill-color:unset!important;]",
          "[&_:is(.presentation-heading)]:[background-clip:unset!important;]",
          "[&_:is(.presentation-heading)]:[background:none!important;]",
          "[&_:is(.presentation-heading)]:!text-primary",
        )}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
