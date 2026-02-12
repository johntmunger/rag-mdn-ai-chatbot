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
    <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              MDN Developer Chat
            </h1>
          </div>
          <span className="hidden lg:inline-block text-sm text-[var(--muted-foreground)] font-medium">
            AI-powered documentation assistant
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
      </div>
    </header>
  );
}
