"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Copy, RotateCcw, Star, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";
import { SourcesFooter } from "./SourcesFooter";
import type { Message } from "@/types";

interface AssistantMessageProps {
  message: Message;
  onRegenerate: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onCopy: (content: string) => void;
}

export function AssistantMessage({
  message,
  onRegenerate,
  onPin,
  onCopy,
}: AssistantMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const isLongMessage = message.content.length > 2000;

  const handleCopy = () => {
    onCopy(message.content);
  };

  return (
    <div
      className="px-4 py-4 hover:bg-[var(--hover-bg)]/30 transition-colors animate-fade-in relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-4xl">
        {/* Toolbar - shown on hover */}
        {isHovered && (
          <div className="absolute right-4 top-2 flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg p-1 animate-fade-in">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
              title="Copy answer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRegenerate(message.id)}
              className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
              title="Regenerate answer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPin(message.id)}
              className={cn(
                "p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors",
                message.isPinned && "text-yellow-500"
              )}
              title={message.isPinned ? "Unpin" : "Pin answer"}
            >
              <Star
                className={cn("w-4 h-4", message.isPinned && "fill-current")}
              />
            </button>
          </div>
        )}

        {/* Message content */}
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            !isExpanded && isLongMessage && "max-h-96 overflow-hidden relative"
          )}
        >
          {!isExpanded && isLongMessage && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
          )}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              code: ({
                className,
                children,
                ...props
              }: React.HTMLAttributes<HTMLElement> & {
                children?: React.ReactNode;
              }) => {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                const isInline = !className?.includes("language-");

                if (!isInline && language) {
                  // Extract text content from children (handles strings, arrays, and React elements)
                  const extractText = (node: any): string => {
                    if (typeof node === "string") {
                      return node;
                    }
                    if (Array.isArray(node)) {
                      return node.map(extractText).join("");
                    }
                    if (node && typeof node === "object" && node.props) {
                      // React element - extract children recursively
                      return extractText(node.props.children);
                    }
                    return "";
                  };
                  
                  const codeText = extractText(children);
                    
                  return (
                    <CodeBlock
                      code={codeText.replace(/\n$/, "")}
                      language={language}
                    />
                  );
                }

                return (
                  <code
                    className={cn(
                      className,
                      "px-1.5 py-0.5 rounded bg-[var(--code-bg)] text-sm font-mono"
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-[var(--accent)] pl-4 italic my-4">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Expand/Collapse button for long messages */}
        {isLongMessage && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "mt-4 flex items-center gap-2 text-sm text-[var(--accent)] hover:underline",
              "transition-colors"
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show full answer
              </>
            )}
          </button>
        )}

        {/* Citations footer */}
        {message.citations && message.citations.length > 0 && (
          <SourcesFooter citations={message.citations} />
        )}
      </div>
    </div>
  );
}
