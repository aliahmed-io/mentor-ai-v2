import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { usePresentationState } from "@/states/presentation-state";
import { Layout } from "lucide-react";

export function PresentationControls({
  shouldShowLabel = true,
}: {
  shouldShowLabel?: boolean;
}) {
  const {
    numSlides,
    setNumSlides,
    language,
    setLanguage,
    pageStyle,
    setPageStyle,
  } = usePresentationState();

  return (
    <div className="space-y-3">
      {/* Static Model Display (GPT only) */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Text Model
          </label>
        )}
        <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
          GPT-4o-mini
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">

      {/* Number of Slides */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of slides
          </label>
        )}
        <Input
          type="number"
          min={5}
          max={12}
          step={1}
          value={numSlides}
          onChange={(e) => {
            const raw = Number(e.target.value);
            const clamped = Number.isFinite(raw)
              ? Math.max(5, Math.min(12, raw))
              : 5;
            setNumSlides(clamped);
          }}
          placeholder="5-12"
        />
      </div>

      {/* Language */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Language
          </label>
        )}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="overflow-hidden">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="z-50 max-h-96">
            <SelectItem value="en-US">English</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Page Style */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Page style
          </label>
        )}
        <Select value={pageStyle} onValueChange={setPageStyle}>
          <SelectTrigger className="overflow-hidden">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <SelectValue placeholder="Select page style" />
            </div>
          </SelectTrigger>
          <SelectContent className="z-50 max-h-96">
            <SelectItem value="default">
              <div className="flex items-center gap-3">
                <span>Default</span>
              </div>
            </SelectItem>
            <SelectItem value="traditional">
              <div className="flex items-center gap-3">
                <span>Traditional</span>
              </div>
            </SelectItem>
            <SelectItem value="tall">
              <div className="flex items-center gap-3">
                <span>Tall</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      </div>
    </div>
  );
}
