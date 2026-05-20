import { SlateElement, type SlateElementProps } from "platejs";

export default function StaircaseStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div className="my-8">{props.children}</div>
    </SlateElement>
  );
}
