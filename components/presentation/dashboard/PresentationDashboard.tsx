"use client";

import { Presentation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { PresentationControls } from "./PresentationControls";
import { PresentationInput } from "./PresentationInput";
import { PresentationsSidebar } from "./PresentationsSidebar";
import { RecentPresentations } from "./RecentPresentations";

export function PresentationDashboard({
  sidebarSide,
}: {
  sidebarSide?: "left" | "right";
}) {
  const router = useRouter();
  const {
    presentationInput,
    isGeneratingOutline,
    setCurrentPresentation,
    setIsGeneratingOutline,
    language,
    theme,
    setShouldStartOutlineGeneration,
  } = usePresentationState();

  useEffect(() => {
    setCurrentPresentation("", "");
    // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
  }, [
    setCurrentPresentation, // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
  ]);

  const handleGenerate = async () => {
    if (!presentationInput.trim()) {
      toast.error("Please enter a topic for your presentation");
      return;
    }

    // Set UI loading state
    setIsGeneratingOutline(true);

    try {
      const result = await createEmptyPresentation(
        presentationInput.substring(0, 50) || "Untitled Presentation",
        theme,
        language,
      );

      if (result.success && result.presentation) {
        // Set the current presentation
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title,
        );
        router.push(`/presentation/generate/${result.presentation.id}`);
      } else {
        setIsGeneratingOutline(false);
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      setIsGeneratingOutline(false);
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 py-6 relative">
      <PresentationsSidebar side={sidebarSide ?? "right"} />

      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary-foreground/90 select-none">
              <Presentation className="size-3 text-primary" /> Slide Generation
            </div>
            <a
              href="/notes"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border/40 text-xs font-bold text-muted-foreground transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-file-text"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
              Try LaTeX Notes Generator
            </a>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Create Presentation
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 font-light max-w-2xl leading-relaxed">
            Describe your topic and customize the basics. Our AI will draft a
            complete outline and slide deck.
          </p>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Work Area */}
        <div className="lg:col-span-8 space-y-6">
          <PresentationInput handleGenerate={handleGenerate} />
          <PresentationControls />

          <div className="flex items-center justify-end pt-2">
            <Button
              onClick={handleGenerate}
              disabled={!presentationInput.trim() || isGeneratingOutline}
              className="w-full py-6 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 gap-2 disabled:opacity-50"
            >
              {isGeneratingOutline ? (
                <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Presentation className="h-4 w-4" />
              )}
              {isGeneratingOutline
                ? "Generating Outline..."
                : "Generate Presentation"}
            </Button>
          </div>
        </div>

        {/* Right Sidebar: History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-card overflow-hidden p-6 md:p-8 space-y-5">
            <div className="mb-2">
              <h2 className="text-lg font-serif font-extrabold text-foreground">
                Recent Presentations
              </h2>
              <p className="text-[11px] text-muted-foreground font-light mt-1">
                Access your generated slide decks.
              </p>
            </div>
            <RecentPresentations />
          </div>
        </div>
      </div>
    </div>
  );
}
