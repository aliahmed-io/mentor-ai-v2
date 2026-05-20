"use client";

import {
  BarChart2,
  BookOpen,
  Brain,
  Calendar,
  MessageSquare,
  Presentation,
  Timer,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import SideBarDropdown from "@/components/auth/Dropdown";
import { MentorLogoLong } from "@/components/globals/MentorLogo";

type SidebarProps = ComponentProps<"nav"> & {
  itemsClassName?: string;
};

export default function Sidebar({
  className,
  itemsClassName,
  ...rest
}: SidebarProps) {
  const pathname = usePathname() ?? "/";

  const links = [
    { href: "/chatbot", label: "Chatbot", icon: MessageSquare },
    { href: "/quiz", label: "Quiz", icon: Brain },
    { href: "/flashcard", label: "Flashcard", icon: BookOpen },
    { href: "/presentation", label: "Presentation", icon: Presentation },
    { href: "/pomodoro", label: "Pomodoro", icon: Timer },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav
      className={`bg-card text-foreground border-r border-border/60 ${className ?? ""}`}
      aria-label="Primary"
      {...rest}
    >
      <div className="h-full flex flex-col">
        <div className="px-6 py-6 border-b border-border/40">
          <Link
            href="/"
            className="inline-flex items-center gap-2 transition-transform active:scale-95"
          >
            <MentorLogoLong />
          </Link>
        </div>
        <div
          className={`flex-1 overflow-y-auto px-3 py-6 ${itemsClassName ?? ""}`}
        >
          <ul className="space-y-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 scale-[1.02]"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                    }`}
                  >
                    <Icon
                      className={`size-4.5 shrink-0 transition-transform ${isActive ? "scale-110" : "opacity-80 group-hover:scale-105"}`}
                    />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-auto border-t border-border/40 p-4 bg-background/40">
          <SideBarDropdown shouldViewFullName align="start" side="top" />
        </div>
      </div>
    </nav>
  );
}
