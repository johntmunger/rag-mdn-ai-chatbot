"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { TypingIndicator } from "./TypingIndicator";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
  onFeedback: (messageId: string, feedback: "up" | "down") => void;
  onRegenerate: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onCopy: (content: string) => void;
}

export function MessageList({
  messages,
  isGenerating,
  onFeedback,
  onRegenerate,
  onPin,
  onCopy,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isAtBottom);

      if (isAtBottom) {
        setUserScrolled(false);
      } else if (!isGenerating) {
        setUserScrolled(true);
      }
    };

    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [isGenerating]);

  useEffect(() => {
    if (!userScrolled && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, userScrolled]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setUserScrolled(false);
    }
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
      <div className="pb-4">
        {messages.map((message) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              onPin={onPin}
              onCopy={onCopy}
            />
          )
        )}

        {isGenerating && <TypingIndicator />}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "fixed bottom-24 right-8 p-3 rounded-full",
            "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
            "shadow-lg transition-all animate-fade-in"
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
