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
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-6 shadow-xl shadow-purple-500/20 dark:shadow-purple-500/40">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Welcome to MDN Developer Chat
          </h2>
          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto leading-relaxed">
            Ask me anything about JavaScript logic, asynchronous programming, or
            any core ECMAScript features covered in MDN documentation. Get
            instant technical answers with source citations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => onExampleClick(example.prompt)}
              className={cn(
                "p-5 rounded-2xl border border-[var(--border)] bg-white dark:bg-gray-800/50",
                "hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30",
                "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10",
                "transition-all duration-300 text-left group",
                "animate-fade-in backdrop-blur-sm",
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {example.title}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                    {example.prompt}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Powered by MDN Web Docs — Responses verified with source citations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
