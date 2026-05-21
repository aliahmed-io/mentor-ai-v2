import { Layout } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clampSlideCount,
  MAX_PRESENTATION_SLIDES,
  MIN_PRESENTATION_SLIDES,
} from "@/lib/presentation/constants";
import { usePresentationState } from "@/states/presentation-state";

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
    textModel,
    setTextModel,
  } = usePresentationState();

  return (
    <div className="space-y-3">
      {/* Dynamic Model Dropdown */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Text Model
          </label>
        )}
        <Select value={textModel} onValueChange={setTextModel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select text model" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="gemini">
              Google Gemini (gemini-2.5-flash)
            </SelectItem>
            <SelectItem value="openai">OpenAI (gpt-4o-mini)</SelectItem>
            <SelectItem value="quality">
              Smart Model Choice (Highest Quality)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Number of Slides */}
        <div>
          {shouldShowLabel && (
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of slides
              </label>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {numSlides}
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <input
              type="range"
              min={MIN_PRESENTATION_SLIDES}
              max={MAX_PRESENTATION_SLIDES}
              step={1}
              value={numSlides}
              onChange={(e) => {
                setNumSlides(clampSlideCount(Number(e.target.value)));
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>{MIN_PRESENTATION_SLIDES}</span>
              <span>{MAX_PRESENTATION_SLIDES}</span>
            </div>
          </div>
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
