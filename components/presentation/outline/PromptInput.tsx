import { usePresentationState } from "@/states/presentation-state";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function PromptInput() {
  const {
    presentationInput,
    setPresentationInput,
    startOutlineGeneration,
    isGeneratingOutline,
  } = usePresentationState();

  const handleGenerateOutline = () => {
    if (!presentationInput.trim()) {
      toast.error("Please enter a presentation topic");
      return;
    }

    startOutlineGeneration();
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={presentationInput}
        onChange={(e) => setPresentationInput(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-4 py-3 pr-12 text-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        placeholder="Enter your presentation topic..."
        disabled={isGeneratingOutline}
      />
      <button
        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
          isGeneratingOutline ? "text-primary/60" : "text-primary hover:text-primary/80"
        }`}
        onClick={handleGenerateOutline}
        disabled={isGeneratingOutline || !presentationInput.trim()}
      >
        <RefreshCw size={20} />
      </button>
    </div>
  );
}
