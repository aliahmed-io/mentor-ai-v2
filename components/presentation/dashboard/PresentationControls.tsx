import { Layout } from "lucide-react";
import { Input } from "@/components/ui/input";
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
          </SelectContent>
        </Select>
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
            min={MIN_PRESENTATION_SLIDES}
            max={MAX_PRESENTATION_SLIDES}
            step={1}
            value={numSlides}
            onChange={(e) => {
              setNumSlides(clampSlideCount(Number(e.target.value)));
            }}
            placeholder={`${MIN_PRESENTATION_SLIDES}-${MAX_PRESENTATION_SLIDES}`}
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
