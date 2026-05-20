"use client";
import type React from "react";
import { usePathname } from "next/navigation";
import { PresentationGenerationManager } from "@/components/presentation/dashboard/PresentationGenerationManager";
import PresentationHeader from "@/components/presentation/presentation-page/PresentationHeader";

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/presentation";

  if (isDashboard) {
    return (
      <>
        <PresentationGenerationManager />
        {children}
      </>
    );
  }

  return (
    <>
      <PresentationGenerationManager />
      <div className="flex h-screen w-screen flex-col supports-[(height:100dvh)]:h-[100dvh] bg-background">
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
