"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  onExampleClick: (prompt: string) => void;
}

const examplePrompts = [
  {
    title: "Explain promises vs async/await",
    prompt:
      "Explain promises vs async/await with examples. When should I use each?",
  },
  {
    title: "Why is 'this' undefined?",
    prompt: "Why is 'this' undefined in my callback function? How do I fix it?",
  },
  {
    title: "How to debounce a function",
    prompt:
      "How do I debounce a function in JavaScript? Show me a practical example.",
  },
  {
    title: "CSS Grid vs Flexbox",
    prompt:
      "What are the differences between CSS Grid and Flexbox? When should I use each?",
  },
];

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">
            Welcome to MDN Developer Chat
          </h2>
          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto">
            Ask me anything about web development, JavaScript, CSS, HTML, or any
            other topics covered in MDN documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => onExampleClick(example.prompt)}
              className={cn(
                "p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]",
                "hover:bg-[var(--hover-bg)] hover:border-[var(--accent)]",
                "transition-all text-left group",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors">
                  <Sparkles className="w-4 h-4 group-hover:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1">{example.title}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                    {example.prompt}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
          <p>
            Powered by MDN Web Docs — Responses verified against official
            documentation
          </p>
        </div>
      </div>
    </div>
  );
}
