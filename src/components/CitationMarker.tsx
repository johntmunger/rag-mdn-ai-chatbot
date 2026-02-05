"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Citation } from "@/types";

interface CitationMarkerProps {
  citation: Citation;
  index: number;
}

export function CitationMarker({ citation, index }: CitationMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className="relative inline-block">
      <sup
        className="text-[var(--accent)] cursor-pointer hover:underline ml-0.5"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        [{index}]
      </sup>

      {showTooltip && (
        <div
          className={cn(
            "absolute bottom-full left-0 mb-2 w-72 p-3 rounded-lg",
            "bg-[var(--background)] border border-[var(--border)] shadow-xl z-50",
            "animate-fade-in"
          )}
        >
          <div className="text-sm font-semibold mb-1">{citation.mdnTitle}</div>
          <div className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-3">
            {citation.excerpt}
          </div>
          <a
            href={citation.mdnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Open MDN
          </a>
        </div>
      )}
    </span>
  );
}
