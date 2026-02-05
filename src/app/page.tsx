"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/EmptyState";
import { MessageList } from "@/components/MessageList";
import { InputBar } from "@/components/InputBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId } from "@/lib/utils";
import type { Message, Settings } from "@/types";

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

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Simulate AI response
    setIsGenerating(true);
    await simulateAIResponse(updatedMessages);
    setIsGenerating(false);
  };

  const simulateAIResponse = async (currentMessages: Message[]) => {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: `# Understanding Your Question

This is a demo response to illustrate the UI. In a real implementation, this would be connected to an AI backend with RAG capabilities using MDN documentation.

## Code Example

Here's a JavaScript example:

\`\`\`javascript
// Example: Using async/await
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Usage
fetchData('https://api.example.com/data')
  .then(data => console.log(data))
  .catch(error => console.error(error));
\`\`\`

## Key Points

1. **Async/Await**: Modern syntax for handling promises
2. **Error Handling**: Use try/catch blocks
3. **Return Values**: Always return or throw in async functions

## Common Pitfalls

- Forgetting to use \`await\` keyword
- Not handling errors properly
- Mixing callbacks with promises

This answer demonstrates the code-first approach with syntax highlighting, line numbers, and interactive features.`,
      timestamp: new Date(),
      citations: [
        {
          id: "1",
          mdnTitle: "async function - JavaScript | MDN",
          mdnUrl:
            "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
          excerpt:
            "The async function declaration defines an asynchronous function that returns an AsyncFunction object...",
        },
        {
          id: "2",
          mdnTitle: "await - JavaScript | MDN",
          mdnUrl:
            "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await",
          excerpt:
            "The await operator is used to wait for a Promise to resolve...",
        },
      ],
    };

    setMessages([...currentMessages, assistantMessage]);
  };

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const messagesToKeep = messages.slice(0, messageIndex);
    setMessages(messagesToKeep);

    setIsGenerating(true);
    await simulateAIResponse(messagesToKeep);
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
