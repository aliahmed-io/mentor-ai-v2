import { PresentationGenerationManager } from "@/components/presentation/dashboard/PresentationGenerationManager";
import PresentationHeader from "@/components/presentation/presentation-page/PresentationHeader";
import type React from "react";

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PresentationGenerationManager />
      <div className="flex h-screen w-screen flex-col supports-[(height:100dvh)]:h-[100dvh]">
        <PresentationHeader />
        <main className="relative flex flex-1 overflow-hidden">
          <div className="sheet-container flex-1 min-h-0 place-items-center overflow-y-auto overflow-x-clip">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
