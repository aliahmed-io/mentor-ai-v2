import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import {
  Searched,
  type SearchResult,
} from "@/components/presentation/outline/Search";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePresentationState } from "@/states/presentation-state";

export function ToolCallDisplay() {
  const { searchResults, isGeneratingOutline, webSearchEnabled } =
    usePresentationState();
  const [isExpanded, setIsExpanded] = useState(false);

  if (
    !webSearchEnabled ||
    (searchResults.length === 0 && !isGeneratingOutline)
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2">
              {isGeneratingOutline ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
              ) : (
                <Search className="h-3.5 w-3.5 text-sky-400" />
              )}
              <span className="text-xs font-semibold text-zinc-200 tracking-wide">
                Web Search Results ({searchResults.length})
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {isExpanded ? "Hide" : "Show"}
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1.5 pt-2">
          {searchResults.map((searchItem, index) => {
            const formattedResults: SearchResult[] = Array.isArray(
              searchItem.results,
            )
              ? searchItem.results.map((result: unknown) => {
                  const searchResult = result as Record<string, unknown>;
                  return {
                    url: (searchResult.url as string) || "",
                    title: (searchResult.title as string) || "No title",
                    published_date: "",
                    content: (searchResult.content as string) || "No content",
                  };
                })
              : [];

            return (
              <Searched
                key={index}
                query={searchItem.query}
                results={formattedResults}
              />
            );
          })}

          {isGeneratingOutline && searchResults.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                <span className="text-xs text-zinc-400">
                  AI is researching the web...
                </span>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
