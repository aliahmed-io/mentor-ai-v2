"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Brain, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ThinkingDisplayProps {
  thinking: string;
  isGenerating: boolean;
  title?: string;
  progress?: { current: number; total: number } | null;
}

export function ThinkingDisplay({
  thinking,
  isGenerating,
  title = "AI is thinking...",
  progress,
}: ThinkingDisplayProps) {
  const [open, setOpen] = useState(false);

  const extractThinkingContent = (text: string): string => {
    return text
      .replace(/^<think>/, "")
      .replace(/<\/think>$/, "")
      .trim();
  };

  const hasClosingTag = /<\/think>/i.test(thinking);
  const thinkingContent = extractThinkingContent(thinking);

  // Only render when there is actual thinking content or when generating with progress
  if (!thinkingContent && !(isGenerating && progress)) {
    return null;
  }

  return (
    <Card
      className={cn(
        "mb-4 w-full border border-border/40 bg-muted backdrop-blur-md",
        "shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl",
      )}
    >
      <CardContent className="p-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              {hasClosingTag && !isGenerating ? (
                <Brain className="h-5 w-5 text-primary" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
                {progress && (
                  <span className="text-xs text-muted-foreground">
                    Slide {progress.current} of {progress.total}
                  </span>
                )}
              </div>
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-300",
                open && "rotate-180",
              )}
            />
          </CollapsibleTrigger>

          <AnimatePresence>
            {open && (
              <CollapsibleContent asChild>
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 rounded-lg border border-border/30 bg-background/60 p-3 text-sm text-muted-foreground max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20"
                >
                  {thinkingContent || (
                    <div className="animate-pulse text-muted-foreground/70">
                      Processing your request...
                    </div>
                  )}
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
