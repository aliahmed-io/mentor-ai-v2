import { ChevronsUpDownIcon, Loader2, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface SearchResult {
  url: string;
  title: string;
  published_date: string;
  content: string;
}
// Searching Component
export function Searching({ query }: { query: string }) {
  return (
    <div className="mb-2 w-full rounded-lg border border-white/10 bg-white/5">
      <div className="flex h-11 items-center gap-3 px-4 text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
        <div className="flex-1">
          <p className="text-xs font-medium text-zinc-300">
            Searching the web for &quot;{query}&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

// Searched Component
export function Searched({
  results,
  query,
}: {
  results: SearchResult[];
  query: string;
}) {
  return (
    <Collapsible className="mb-1.5 w-full rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 w-full justify-between px-4 text-zinc-200 hover:bg-white/10 hover:text-white rounded-none"
        >
          <div className="flex w-[90%] items-center gap-3">
            <SearchIcon className="h-4 w-4 text-zinc-400 shrink-0" />
            <div className="flex flex-col items-start overflow-hidden">
              <span className="w-full truncate text-xs font-semibold text-zinc-200">
                {query}
              </span>
              <span className="text-[10px] text-zinc-500">
                {results?.length} results found
              </span>
            </div>
          </div>
          <ChevronsUpDownIcon className="h-4 w-4 text-zinc-500 shrink-0 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 px-3 pb-3 pt-2">
        {results.map((result, index) => {
          let domain = result.url;
          try {
            domain = new URL(result.url).hostname;
          } catch {
            // fallback to raw url
          }
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-md border border-white/10 bg-white/5 p-2.5"
            >
              {/** biome-ignore lint/performance/noImgElement: valid favicon use */}
              <img
                src={faviconUrl}
                alt={domain}
                className="mt-0.5 h-3.5 w-3.5 rounded-sm shrink-0"
              />
              <div className="min-w-0 flex-1 overflow-hidden">
                <h4 className="truncate text-xs font-semibold text-zinc-200">
                  {result.title}
                </h4>
                <p className="line-clamp-2 text-[10px] text-zinc-500 mt-0.5">
                  {result.content}
                </p>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-[10px] text-sky-400 hover:text-sky-300 hover:underline mt-1"
                >
                  {result.url}
                </a>
              </div>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
