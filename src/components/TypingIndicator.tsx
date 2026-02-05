"use client";

interface TypingIndicatorProps {
  text?: string;
}

export function TypingIndicator({
  text = "Thinking about your question...",
}: TypingIndicatorProps) {
  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-sm text-[var(--muted-foreground)]">{text}</span>
      </div>
    </div>
  );
}
