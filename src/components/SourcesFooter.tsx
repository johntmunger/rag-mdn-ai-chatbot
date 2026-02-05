"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { Citation } from "@/types";

interface SourcesFooterProps {
  citations: Citation[];
}

export function SourcesFooter({ citations }: SourcesFooterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (citations.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <span className="font-medium">
          Sources: {citations.map((_, i) => `[${i + 1}]`).join(" ")}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {citations.map((citation, index) => (
            <div
              key={citation.id}
              className="p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-1">
                    {citation.mdnTitle}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-2">
                    {citation.excerpt}
                  </div>
                  <a
                    href={citation.mdnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {citation.mdnUrl}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
