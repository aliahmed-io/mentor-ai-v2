"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import Image from "next/image";

type SidebarProps = ComponentProps<"nav"> & {
  itemsClassName?: string;
};

export default function Sidebar({ className, itemsClassName, ...rest }: SidebarProps) {
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
      className={`bg-neutral-950 text-neutral-200 border-r border-neutral-800 ${className ?? ""}`}
      aria-label="Primary"
      {...rest}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/white-long-logo.svg"
              alt="Mentor AI"
              width={160}
              height={28}
              priority
            />
          </Link>
        </div>
        <div className={`flex-1 overflow-y-auto ${itemsClassName ?? ""}`}>
          <ul className="py-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`block px-4 py-2.5 text-sm rounded-md mx-2 my-1 transition-colors ${
                      isActive
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="px-4 py-3 text-xs text-neutral-400">
          v0.1
        </div>
      </div>
    </nav>
  );
}


