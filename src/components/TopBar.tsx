"use client";

import {
  Moon,
  Sun,
  Monitor,
  Settings,
  Download,
  RotateCcw,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onSettingsClick: () => void;
  onDownload: () => void;
  onRestart: () => void;
}

export function TopBar({
  onSettingsClick,
  onDownload,
  onRestart,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">MDN Developer Chat</h1>
        <span className="hidden sm:inline-block text-sm text-[var(--muted-foreground)]">
          AI powered documentation assistant
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDownload}
          className={cn(
            "p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          )}
          aria-label="Download conversation"
          title="Download conversation"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onRestart}
          className={cn(
            "p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          )}
          aria-label="Restart conversation"
          title="Clear chat and start over"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-[var(--border)]" />
        <button
          onClick={cycleTheme}
          className={cn(
            "p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          )}
          aria-label="Toggle theme"
          title={`Current theme: ${theme}`}
        >
          <ThemeIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onSettingsClick}
          className={cn(
            "p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          )}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
