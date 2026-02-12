"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/EmptyState";
import { MessageList } from "@/components/MessageList";
import { InputBar } from "@/components/InputBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId } from "@/lib/utils";
import type { Message, Settings, Citation } from "@/types";

// Default settings
const defaultSettings: Settings = {
  theme: "system",
  answerStyle: "balanced",
  codeStyle: {
    preferModernSyntax: true,
    showTypeScriptVariations: false,
  },
  experimental: {
    stepByStepExplanations: false,
    showCompatibilityNotes: false,
  },
  verificationMode: false,
};

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useLocalStorage<Message[]>("messages", []);
  const [settings, setSettings] = useLocalStorage<Settings>(
    "settings",
    defaultSettings
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Call streaming API
    setIsGenerating(true);
    await callStreamingAPI(updatedMessages);
    setIsGenerating(false);
  };

  const callStreamingAPI = async (currentMessages: Message[]) => {
    try {
      const lastUserMessage = currentMessages[currentMessages.length - 1];
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastUserMessage.content }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        citations: data.citations || [],
      };

      setMessages([...currentMessages, assistantMessage]);
    } catch (error) {
      console.error("Error calling API:", error);
      
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `# ⚠️ API Connection Error\n\nCould not connect to the RAG backend.\n\n**Error:** ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };

      setMessages([...currentMessages, assistantMessage]);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const messagesToKeep = messages.slice(0, messageIndex);
    setMessages(messagesToKeep);

    setIsGenerating(true);
    await callStreamingAPI(messagesToKeep);
    setIsGenerating(false);
  };

  const handlePin = (messageId: string) => {
    setMessages(
      messages.map((msg) =>
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
      )
    );
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    const conversationText = messages
      .map((msg) => `${msg.role.toUpperCase()}:\n${msg.content}\n`)
      .join("\n---\n\n");

    const blob = new Blob([conversationText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mdn-chat-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestart = () => {
    if (
      messages.length > 0 &&
      confirm("Clear the entire conversation and start over?")
    ) {
      setMessages([]);
    }
  };

  const quickSuggestions =
    messages.length > 0
      ? [
          "Summarize this answer",
          "Explain like I'm new to JS",
          "Give a shorter example",
        ]
      : [];

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="h-screen flex flex-col bg-[var(--background)]">
        <TopBar
          onSettingsClick={() => setIsSettingsOpen(true)}
          onDownload={handleDownload}
          onRestart={handleRestart}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <EmptyState onExampleClick={handleSendMessage} />
          <InputBar
            onSend={handleSendMessage}
            disabled={false}
            suggestions={[]}
            placeholder="Ask about JavaScript, CSS, HTML, Web APIs, or any web development topic..."
          />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      <TopBar
        onSettingsClick={() => setIsSettingsOpen(true)}
        onDownload={handleDownload}
        onRestart={handleRestart}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 && !isGenerating ? (
          <EmptyState onExampleClick={handleSendMessage} />
        ) : (
          <MessageList
            messages={messages}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
            onPin={handlePin}
            onCopy={handleCopy}
          />
        )}

        <InputBar
          onSend={handleSendMessage}
          disabled={isGenerating}
          suggestions={quickSuggestions}
          placeholder="Ask about JavaScript, CSS, HTML, Web APIs, or any web development topic..."
        />
      </main>

      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
