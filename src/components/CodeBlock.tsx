"use client";

import { useState } from "react";
import { Copy, Check, Play, WrapText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRun = () => {
    setShowPlayground(true);
  };

  const lines = code.split("\n");

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--code-bg)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]">
        <span className="text-xs font-mono text-[var(--muted-foreground)] uppercase">
          {language}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsWrapped(!isWrapped)}
            className={cn(
              "p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors",
              isWrapped && "bg-[var(--hover-bg)]"
            )}
            title={isWrapped ? "Disable wrap" : "Enable wrap"}
          >
            <WrapText className="w-4 h-4" />
          </button>
          {(language === "javascript" || language === "js") && (
            <button
              onClick={handleRun}
              className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
              title="Run code"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
            title="Copy code"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div
        className={cn(
          "relative",
          isWrapped ? "overflow-x-auto" : "overflow-x-scroll"
        )}
      >
        <pre className="p-4 m-0">
          <code
            className={cn(
              "font-mono text-sm leading-relaxed",
              isWrapped ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            )}
          >
            {lines.map((line, i) => (
              <div key={i} className="table-row">
                <span className="table-cell select-none pr-4 text-right text-[var(--muted-foreground)] w-8">
                  {i + 1}
                </span>
                <span className="table-cell">{line || "\n"}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Playground Modal */}
      {showPlayground && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold">JavaScript Playground</h3>
              <button
                onClick={() => setShowPlayground(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Code</label>
                  <textarea
                    defaultValue={code}
                    className="w-full h-48 p-3 font-mono text-sm rounded border border-[var(--border)] bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  />
                </div>
                <button
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
                  onClick={() => {
                    // Placeholder for running code
                    alert(
                      "Code execution would happen here. This is a UI demo."
                    );
                  }}
                >
                  Run Code
                </button>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Console Output
                  </label>
                  <div className="p-3 font-mono text-sm rounded border border-[var(--border)] bg-[var(--code-bg)] min-h-[100px]">
                    <div className="text-[var(--muted-foreground)]">
                      {/* Console output will appear here */}
                      Console output...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
