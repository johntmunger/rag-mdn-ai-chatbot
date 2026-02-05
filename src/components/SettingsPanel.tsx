"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Settings } from "@/types";

interface SettingsPanelProps {
  isOpen: boolean;
  settings: Settings;
  onClose: () => void;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsPanel({
  isOpen,
  settings,
  onClose,
  onSettingsChange,
}: SettingsPanelProps) {
  const updateSettings = (updates: Partial<Settings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateCodeStyle = (updates: Partial<Settings["codeStyle"]>) => {
    onSettingsChange({
      ...settings,
      codeStyle: { ...settings.codeStyle, ...updates },
    });
  };

  const updateExperimental = (updates: Partial<Settings["experimental"]>) => {
    onSettingsChange({
      ...settings,
      experimental: { ...settings.experimental, ...updates },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--background)] border-l border-[var(--border)] z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Answer Style */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Answer Style</h3>
            <div className="space-y-2">
              {(["concise", "balanced", "detailed"] as const).map((style) => (
                <label
                  key={style}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer",
                    "transition-colors hover:bg-[var(--hover-bg)]",
                    settings.answerStyle === style
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)]"
                  )}
                >
                  <input
                    type="radio"
                    name="answerStyle"
                    value={style}
                    checked={settings.answerStyle === style}
                    onChange={(e) =>
                      updateSettings({
                        answerStyle: e.target.value as typeof style,
                      })
                    }
                    className="accent-[var(--accent)]"
                  />
                  <div className="flex-1">
                    <div className="font-medium capitalize">{style}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {style === "concise" && "Brief, to-the-point answers"}
                      {style === "balanced" && "Good detail with examples"}
                      {style === "detailed" && "Comprehensive explanations"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Code Style */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Code Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="font-medium text-sm">Modern ES6+ Syntax</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Use arrow functions, template literals, etc.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.codeStyle.preferModernSyntax}
                  onChange={(e) =>
                    updateCodeStyle({ preferModernSyntax: e.target.checked })
                  }
                  className="accent-[var(--accent)] w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    TypeScript Variations
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Show TypeScript alternatives when relevant
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.codeStyle.showTypeScriptVariations}
                  onChange={(e) =>
                    updateCodeStyle({
                      showTypeScriptVariations: e.target.checked,
                    })
                  }
                  className="accent-[var(--accent)] w-5 h-5"
                />
              </label>
            </div>
          </section>

          {/* Experimental Features */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Experimental</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    Step-by-Step Explanations
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Break down complex topics into steps
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.experimental.stepByStepExplanations}
                  onChange={(e) =>
                    updateExperimental({
                      stepByStepExplanations: e.target.checked,
                    })
                  }
                  className="accent-[var(--accent)] w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    Browser Compatibility Notes
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Include browser support information
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.experimental.showCompatibilityNotes}
                  onChange={(e) =>
                    updateExperimental({
                      showCompatibilityNotes: e.target.checked,
                    })
                  }
                  className="accent-[var(--accent)} w-5 h-5"
                />
              </label>
            </div>
          </section>

          {/* Verification Mode */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Citation Display</h3>
            <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer">
              <div className="flex-1">
                <div className="font-medium text-sm">Verification Mode</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Highlight statements backed by MDN
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.verificationMode}
                onChange={(e) =>
                  updateSettings({ verificationMode: e.target.checked })
                }
                className="accent-[var(--accent)] w-5 h-5"
              />
            </label>
          </section>

          {/* About */}
          <section className="pt-4 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold mb-2">About</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              MDN Developer Chat is an AI-powered documentation assistant that
              helps you learn and build for the web. Get accurate answers about
              JavaScript, CSS, HTML, and more with code examples and citations
              to official MDN documentation.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
