import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SlidePreviewCardProps {
  index: number;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function SlidePreviewCard({
  index,
  isActive,
  onClick,
  children,
}: SlidePreviewCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.2);

  const BASE_WIDTH = 1024; // Logical slide width to scale from
  const BASE_HEIGHT = 576; // Logical slide height to scale from (16:9)

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const update = () => {
      const containerRect = container.getBoundingClientRect();
      const newScale =
        containerRect.width > 0 ? containerRect.width / BASE_WIDTH : 0.2;
      setScale(newScale);
    };

    const resizeObserver = new ResizeObserver(() => update());
    resizeObserver.observe(container);

    update();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-md border transition-all hover:border-primary",
        isActive ? "border-primary ring-1 ring-primary" : "border-muted",
      )}
      onClick={onClick}
    >
      <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm border border-border text-xs font-semibold text-foreground">
        {index + 1}
      </div>
      <div
        ref={containerRef}
        className="pointer-events-none w-full overflow-hidden bg-card aspect-video relative"
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
