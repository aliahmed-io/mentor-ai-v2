"use client";
import SideBarDropdown from "@/components/auth/Dropdown";
import { Brain } from "@/components/ui/icons";
import { usePresentationState } from "@/states/presentation-state";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Import our new components
import AllweoneText from "@/components/globals/allweone-logo";
import { Button } from "@/components/ui/button";
import * as motion from "framer-motion/client";
import { ExportButton } from "./buttons/ExportButton";
import { PresentButton } from "./buttons/PresentButton";
import { SaveStatus } from "./buttons/SaveStatus";
import { ShareButton } from "./buttons/ShareButton";

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
            <Button size={"icon"} className="rounded-full" variant={"ghost"}>
              <Brain></Brain>
            </Button>
          </Link>

          <motion.div
            initial={false}
            layout="position"
            transition={{ duration: 1 }}
          >
            <Link href="/" className="h-max">
              <AllweoneText className="h-10 w-[7.5rem] cursor-pointer transition-transform duration-100 active:scale-95"></AllweoneText>
            </Link>
          </motion.div>
        </div>

        {/* Profile moved to global sidebar */}
      </header>
    );


}
