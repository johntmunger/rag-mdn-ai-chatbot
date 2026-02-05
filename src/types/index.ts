export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date | string;
  citations?: Citation[];
  isPinned?: boolean;
  feedback?: "up" | "down" | null;
  feedbackReason?: string;
}

export interface Citation {
  id: string;
  mdnTitle: string;
  mdnUrl: string;
  excerpt: string;
  sentenceIndex?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date | string;
  updatedAt: Date | string;
  isStarred?: boolean;
}

export interface Settings {
  theme: "light" | "dark" | "system";
  answerStyle: "concise" | "balanced" | "detailed";
  codeStyle: {
    preferModernSyntax: boolean;
    showTypeScriptVariations: boolean;
  };
  experimental: {
    stepByStepExplanations: boolean;
    showCompatibilityNotes: boolean;
  };
  verificationMode: boolean;
}

export interface SavedAnswer {
  messageId: string;
  conversationId: string;
  title: string;
  preview: string;
  savedAt: Date | string;
}

export type AnswerStyle = "concise" | "balanced" | "detailed";
export type Theme = "light" | "dark" | "system";
