"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import SideBarDropdown from "@/components/auth/Dropdown";

type SidebarProps = ComponentProps<"nav"> & {
  itemsClassName?: string;
};

export default function Sidebar({
  className,
  itemsClassName,
  ...rest
}: SidebarProps) {
  const pathname = usePathname() ?? "/";

  const links: Array<{ href: string; label: string }> = [
    { href: "/chatbot", label: "Chatbot" },
    { href: "/quiz", label: "Quiz" },
    { href: "/flashcard", label: "Flashcard" },
    { href: "/presentation", label: "Presentation" },
    { href: "/pomodoro", label: "Pomodoro" },
    { href: "/calendar", label: "Calendar" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <nav
      className={`bg-card text-foreground border-r border-border/60 ${className ?? ""}`}
      aria-label="Primary"
      {...rest}
    >
      <div className="h-full flex flex-col">
        <div className="px-6 py-5 border-b border-border/40">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/white-long-logo.svg"
              alt="Mentor AI"
              width={140}
              height={24}
              priority
              className="dark:invert-0 invert transition-all duration-300"
            />
          </Link>
        </div>
        <div
          className={`flex-1 overflow-y-auto px-2 py-4 ${itemsClassName ?? ""}`}
        >
          <ul className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`block px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/10"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground font-normal"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-auto border-t border-border/40 p-4">
          <SideBarDropdown shouldViewFullName align="start" side="top" />
        </div>
      </div>
    </nav>
  );
}
