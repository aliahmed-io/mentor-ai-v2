"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getPresentation } from "@/app/_actions/presentation/presentationActions";
import PresentationEditorStaticView from "@/components/presentation/editor/presentation-editor-static";
import type { PlateSlide } from "@/components/presentation/utils/parser";
import {
  setThemeVariables,
  type ThemeProperties,
  themes,
} from "@/lib/presentation/themes";

function ExportPresentationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [slides, setSlides] = useState<PlateSlide[]>([]);
  const [themeData, setThemeData] = useState<ThemeProperties | null>(null);

  const { data: presentationData, isLoading } = useQuery({
    queryKey: ["presentation-export", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      const result = await getPresentation(id);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to load presentation");
      }
      return result.presentation;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (presentationData) {
      const presentationContent = presentationData.presentation
        ?.content as unknown as {
        slides: PlateSlide[];
        config: Record<string, unknown>;
      };

      const dbSlides = Array.isArray(presentationContent?.slides)
        ? presentationContent?.slides
        : [];
      if (dbSlides.length > 0) {
        setSlides(dbSlides);
      }

      if (presentationData.presentation?.theme) {
        const themeId = presentationData.presentation.theme;
        if (themeId in themes) {
          setThemeData(themes[themeId as keyof typeof themes]);
        }
      }
    }
  }, [presentationData]);

  useEffect(() => {
    if (themeData) {
      setThemeVariables(themeData, false);
    }
  }, [themeData]);

  useEffect(() => {
    if (slides.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        window.print();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [slides, isLoading]);

  if (isLoading || slides.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-xl">Preparing for export...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 1920px 1080px;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          .export-slide {
            page-break-after: always;
            page-break-inside: avoid;
            width: 1920px;
            height: 1080px;
            overflow: hidden;
            background-color: var(--presentation-background);
          }
        }
        
        /* On screen preview */
        .export-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          background: #f1f5f9;
          min-height: 100vh;
        }
        
        .export-slide {
          width: 1920px;
          height: 1080px;
          flex-shrink: 0;
          background-color: var(--presentation-background);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          transform-origin: top center;
          /* Scale down to fit most screens */
          transform: scale(0.6);
          margin-bottom: -432px; /* adjust for scale to not take 1080px space */
          overflow: hidden;
        }

        @media print {
          .export-container {
            padding: 0;
            background: none;
            gap: 0;
          }
          .export-slide {
            box-shadow: none;
            transform: none;
            margin-bottom: 0;
          }
        }
      `}</style>
      <div className="export-container">
        {slides.map((slide, index) => (
          <div key={slide.id || index} className="export-slide">
            <PresentationEditorStaticView
              initialContent={slide}
              id={slide.id}
              className="h-full w-full"
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default function ExportPresentationPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-xl">Loading export environment...</p>
      </div>
    }>
      <ExportPresentationContent />
    </Suspense>
  );
}
