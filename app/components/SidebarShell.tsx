"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import Sidebar from "./Sidebar";

export default function SidebarShell({ children }: PropsWithChildren) {
  const pathname = usePathname() ?? "/";
  const inPresentation = pathname.startsWith("/presentation");
  const onPresentationRoot = pathname === "/presentation";
  const showSidebar =
    (!inPresentation && pathname !== "/" && !pathname.startsWith("/auth")) ||
    onPresentationRoot;

  if (!showSidebar) {
    return <>{children}</>;
  }



  // Standard two-column shell for all other pages
  return (
    <div className="flex min-h-dvh">
      <Sidebar className="sticky top-0 h-dvh w-56 shrink-0" />
      <main className="flex-1 min-w-0 bg-background">
        <div className="mx-auto max-w-7xl p-6 md:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
