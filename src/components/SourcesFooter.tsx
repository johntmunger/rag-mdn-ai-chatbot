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
    <div className="mt-6 pt-4 border-t border-[var(--border)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 text-sm hover:text-[var(--foreground)] transition-colors w-full group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {citations.map((_, i) => (
              <span
                key={i}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors"
              >
                {i + 1}
              </span>
            ))}
          </div>
          <span className="text-xs font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
            {citations.length} {citations.length === 1 ? 'source' : 'sources'}
          </span>
        </div>
        <div className="flex-1" />
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {citations.map((citation, index) => (
            <div
              key={citation.id}
              className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    {citation.mdnTitle}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-3 leading-relaxed">
                    {citation.excerpt}
                  </div>
                  <a
                    href={citation.mdnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on MDN
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
