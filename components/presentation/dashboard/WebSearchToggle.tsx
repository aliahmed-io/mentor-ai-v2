import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { Globe } from "lucide-react";

export function WebSearchToggle() {
  const { webSearchEnabled, setWebSearchEnabled, isGeneratingOutline } =
    usePresentationState();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isGeneratingOutline}
      onClick={() => setWebSearchEnabled(!webSearchEnabled)}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-all mr-2 hover:shadow-md ${
        webSearchEnabled ? "border-primary/60" : "border-border/50"
      }`}
      aria-pressed={webSearchEnabled}
    >
      <Globe
        className={`h-3.5 w-3.5 transition-colors ${webSearchEnabled ? "text-primary" : "text-muted-foreground"}`}
      />
      <span className="text-xs">Web Search</span>
      <span
        className={`text-[10px] leading-none px-2 py-0.5 rounded-full border text-center min-w-[28px] ${
          webSearchEnabled
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        {webSearchEnabled ? "On" : "Off"}
      </span>
    </Button>
  );
}
