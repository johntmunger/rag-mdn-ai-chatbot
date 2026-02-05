"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/types";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateTheme = () => {
        const isDark = mediaQuery.matches;
        setResolvedTheme(isDark ? "dark" : "light");
      };

      // Initial update via callback
      updateTheme();

      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    } else {
      root.classList.add(`theme-${theme}`);
      // Synchronizing theme state with DOM/localStorage - valid use case
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResolvedTheme(theme);
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", theme);
      }
    }
  }, [theme]);

  return { theme, setTheme, resolvedTheme };
}
