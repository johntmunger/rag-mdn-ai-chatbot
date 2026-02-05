"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end px-4 py-3 animate-fade-in">
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl",
          "bg-[var(--user-message-bg)] border border-[var(--border)]"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded bg-[var(--code-bg)] text-sm font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
