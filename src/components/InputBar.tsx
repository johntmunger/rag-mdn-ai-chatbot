"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export function InputBar({
  onSend,
  disabled = false,
  placeholder = "Ask about JavaScript, CSS, HTML, Web APIs, or any web development topic...",
  suggestions = [],
}: InputBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion);
  };

  return (
    <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)] py-4 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quick suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 animate-fade-in">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full",
                  "bg-[var(--muted)] hover:bg-[var(--hover-bg)]",
                  "border border-[var(--border)] transition-colors",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input container */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full p-4 pr-14 rounded-2xl resize-none",
              "bg-[var(--input-bg)] border border-[var(--border)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
              "transition-all max-h-[200px] overflow-y-auto",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
          />

          {/* Send button inside textarea */}
          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl",
              "bg-[var(--accent)] hover:bg-[var(--accent-hover)]",
              "text-white transition-all flex items-center justify-center",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              input.trim() && !disabled ? "scale-100" : "scale-90 opacity-50"
            )}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-xs text-[var(--muted-foreground)] text-center">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)]">
            Enter
          </kbd>{" "}
          to send,
          <kbd className="ml-1 px-1.5 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)]">
            Shift + Enter
          </kbd>{" "}
          for newline
        </div>
      </div>
    </div>
  );
}
