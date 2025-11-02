"use client";

import { Moon, Sun } from "lucide-react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme,
} from "next-themes";

import { Switch } from "@/components/ui/switch";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div
      role="menuitem"
      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
      onClick={toggleTheme}
    >
      <span>Change Theme</span>
      <div className="flex items-center">
        <Sun className="h-4 w-4 rotate-0 transition-all dark:hidden" />
        <Moon className="hidden h-4 w-4 rotate-0 transition-all dark:block" />
        <Switch
          checked={theme === "dark"}
          onCheckedChange={toggleTheme}
          className="ml-2"
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </div>
  );
}
