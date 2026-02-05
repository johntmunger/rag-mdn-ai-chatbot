"use client";

import { Plus, Star, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { Conversation, SavedAnswer } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  savedAnswers: SavedAnswer[];
  currentConversationId: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onSelectSavedAnswer: (answer: SavedAnswer) => void;
  onToggleStarConversation: (id: string) => void;
}

export function Sidebar({
  isOpen,
  conversations,
  savedAnswers,
  currentConversationId,
  onClose,
  onNewChat,
  onSelectConversation,
  onSelectSavedAnswer,
  onToggleStarConversation,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border)] z-50",
          "flex flex-col transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-sm">Conversations</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--hover-bg)] lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-[var(--border)]">
          <button
            onClick={onNewChat}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
              "transition-colors font-medium"
            )}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "relative flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer",
                  "hover:bg-[var(--hover-bg)] transition-colors group",
                  currentConversationId === conversation.id &&
                    "bg-[var(--hover-bg)]"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--muted-foreground)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {formatTimestamp(conversation.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStarConversation(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label={
                    conversation.isStarred
                      ? "Unstar conversation"
                      : "Star conversation"
                  }
                >
                  <Star
                    className={cn(
                      "w-4 h-4",
                      conversation.isStarred
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-[var(--muted-foreground)]"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Saved Answers Section */}
          {savedAnswers.length > 0 && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <h3 className="px-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">
                Saved Answers
              </h3>
              <div className="p-2 space-y-1">
                {savedAnswers.map((answer) => (
                  <button
                    key={answer.messageId}
                    onClick={() => onSelectSavedAnswer(answer)}
                    className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left hover:bg-[var(--hover-bg)] transition-colors"
                    aria-label={`Open saved answer: ${answer.title}`}
                  >
                    <Star className="w-4 h-4 mt-0.5 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {answer.title}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                        {answer.preview}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
