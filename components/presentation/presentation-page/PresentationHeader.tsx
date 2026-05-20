"use client";
import * as motion from "framer-motion/client";
import { ArrowLeft, ChevronRight, Layout, Monitor } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
// Import our new components
import {
  MentorLogoLong,
  MentorLogoShort,
} from "@/components/globals/MentorLogo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { ExportButton } from "./buttons/ExportButton";
import { PresentButton } from "./buttons/PresentButton";
import { SaveStatus } from "./buttons/SaveStatus";

interface PresentationHeaderProps {
  title?: string;
}

export default function PresentationHeader({ title }: PresentationHeaderProps) {
  const currentPresentationTitle = usePresentationState(
    (s) => s.currentPresentationTitle,
  );
  const isPresenting = usePresentationState((s) => s.isPresenting);
  const currentPresentationId = usePresentationState(
    (s) => s.currentPresentationId,
  );
  const viewMode = usePresentationState((s) => s.viewMode);
  const setViewMode = usePresentationState((s) => s.setViewMode);
  const [presentationTitle, setPresentationTitle] =
    useState<string>("Presentation");
  const pathname = usePathname();
  // Check if we're on the generate/outline page
  const isPresentationPage =
    pathname.startsWith("/presentation/") && !pathname.includes("generate");

  // Update title when it changes in the state
  useEffect(() => {
    if (currentPresentationTitle) {
      setPresentationTitle(currentPresentationTitle);
    } else if (title) {
      setPresentationTitle(title);
    }
  }, [currentPresentationTitle, title]);

  if (pathname === "/presentation/create")
    return (
      <header className="flex h-12 max-w-[100vw]  items-center justify-between overflow-clip border-accent px-2 py-2">
        <div className="flex items-center gap-2">
          {/* This component is suppose to be logo but for now its is actually hamburger menu */}

          <Link href={"/presentation/create"}>
            <Button
              size={"icon"}
              className="rounded-full animate-pulse-slow"
              variant={"ghost"}
            >
              <MentorLogoShort className="size-5" />
            </Button>
          </Link>

          <motion.div
            initial={false}
            layout="position"
            transition={{ duration: 1 }}
          >
            <Link href="/" className="h-max block">
              <MentorLogoLong className="cursor-pointer transition-transform duration-100 active:scale-95" />
            </Link>
          </motion.div>
        </div>

        {/* Profile moved to global sidebar */}
      </header>
    );

  // Default header for presentation view ([id])
  if (isPresentationPage) {
    return (
      <header className="flex h-12 w-full items-center justify-between border-b border-accent bg-background px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/presentation"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/presentation"
              className="hover:text-foreground flex items-center"
            >
              <MentorLogoShort className="size-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {presentationTitle}
            </span>
          </div>
        </div>

        {!isPresenting && (
          <div className="flex items-center gap-2">
            <SaveStatus />
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setViewMode(viewMode === "slides" ? "web" : "slides")
              }
              className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.02]"
            >
              {viewMode === "slides" ? (
                <>
                  <Layout className="mr-1 h-4 w-4" /> Web View
                </>
              ) : (
                <>
                  <Monitor className="mr-1 h-4 w-4" /> Slide View
                </>
              )}
            </Button>
            <ExportButton presentationId={currentPresentationId ?? ""} />
            <PresentButton />
          </div>
        )}
      </header>
    );
  }

  return null;
}
