import { SlateElement, type SlateElementProps } from "platejs";

import { cn } from "@/lib/utils";

export function PresentationParagraphElementStatic(props: SlateElementProps) {
  const { as: _as, ...restProps } = props as any;
  return (
    <SlateElement
      {...restProps}
      as="div"
      className={cn("presentation-paragraph m-0 px-0 py-1 text-base")}
    >
      {props.children}
    </SlateElement>
  );
}
