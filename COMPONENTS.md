# Component Reference Guide

Quick reference for all components in the JS Assistant chat interface.

## Layout Components

### TopBar

**Path**: `src/components/TopBar.tsx`
**Purpose**: Main header with branding and controls
**Props**:

- `onSettingsClick: () => void` - Callback for settings button
- `onMenuClick: () => void` - Callback for mobile menu toggle

**Features**:

- App branding with gradient logo
- Theme toggle (light/dark/system cycle)
- Settings button
- Mobile menu button (hidden on desktop)

---

### Sidebar

**Path**: `src/components/Sidebar.tsx`
**Purpose**: Conversation history and saved answers
**Props**:

- `isOpen: boolean` - Sidebar visibility
- `conversations: Conversation[]` - List of conversations
- `savedAnswers: SavedAnswer[]` - Pinned answers
- `currentConversationId: string | null` - Active conversation
- `onClose: () => void` - Close callback
- `onNewChat: () => void` - New conversation callback
- `onSelectConversation: (id: string) => void` - Select callback
- `onSelectSavedAnswer: (answer: SavedAnswer) => void` - Navigate to pinned answer
- `onToggleStarConversation: (id: string) => void` - Star/unstar callback

**Features**:

- Collapsible on mobile (full-screen drawer)
- New chat button
- Conversation list with timestamps
- Star/favorite functionality
- Saved answers section
- Backdrop overlay on mobile

---

### EmptyState

**Path**: `src/components/EmptyState.tsx`
**Purpose**: Welcome screen shown when no messages
**Props**:

- `onExampleClick: (prompt: string) => void` - Callback when example is clicked

**Features**:

- Welcome message with icon
- 5 example prompts as clickable cards
- Animated entrance
- Responsive grid layout
- Subtle MDN mention

---

## Message Components

### MessageList

**Path**: `src/components/MessageList.tsx`
**Purpose**: Scrollable container for all messages
**Props**:

- `messages: Message[]` - Array of messages
- `isGenerating: boolean` - Show typing indicator
- `onFeedback: (messageId: string, feedback: 'up' | 'down') => void`
- `onRegenerate: (messageId: string) => void`
- `onPin: (messageId: string) => void`
- `onCopy: (content: string) => void`

**Features**:

- Auto-scroll to bottom (unless user scrolled up)
- "Scroll to bottom" floating button
- Handles user scroll intent
- Typing indicator integration
- Smooth scrolling

---

### UserMessage

**Path**: `src/components/UserMessage.tsx`
**Purpose**: Display user messages
**Props**:

- `message: Message` - Message object

**Features**:

- Right-aligned bubble
- Markdown support
- Inline code formatting
- Fade-in animation

---

### AssistantMessage

**Path**: `src/components/AssistantMessage.tsx`
**Purpose**: Display AI assistant responses
**Props**:

- `message: Message` - Message object
- `onFeedback: (messageId: string, feedback: 'up' | 'down') => void`
- `onRegenerate: (messageId: string) => void`
- `onPin: (messageId: string) => void`
- `onCopy: (content: string) => void`

**Features**:

- Full-width document-style layout
- Hover toolbar with actions
- Markdown rendering with custom components
- Syntax-highlighted code blocks
- Expandable for long messages
- Feedback collection (thumbs up/down with reasons)
- Citations integration
- Sources footer

---

### CodeBlock

**Path**: `src/components/CodeBlock.tsx`
**Purpose**: Enhanced code display with features
**Props**:

- `code: string` - Code content
- `language: string` - Programming language

**Features**:

- Syntax highlighting
- Line numbers (aligned with table layout)
- Language indicator badge
- Copy button with feedback
- Text wrapping toggle
- Run button (for JavaScript)
- Playground modal (placeholder)

---

## Input Components

### InputBar

**Path**: `src/components/InputBar.tsx`
**Purpose**: Message input with features
**Props**:

- `onSend: (message: string) => void` - Send callback
- `disabled?: boolean` - Disable during generation
- `placeholder?: string` - Custom placeholder
- `suggestions?: string[]` - Quick suggestion chips

**Features**:

- Multi-line auto-resizing textarea
- Cycling placeholder hints
- Quick suggestion chips above input
- Send button (inside textarea)
- Code snippet button
- Keyboard shortcuts (Enter/Shift+Enter)
- Helper text for shortcuts

---

### TypingIndicator

**Path**: `src/components/TypingIndicator.tsx`
**Purpose**: Animated "AI is thinking" indicator
**Props**:

- `text?: string` - Custom status text (default: "Thinking about your question...")

**Features**:

- Three animated dots
- Customizable status text
- Fade-in animation
- Consistent with message styling

---

## Settings & Modals

### SettingsPanel

**Path**: `src/components/SettingsPanel.tsx`
**Purpose**: Settings drawer with all preferences
**Props**:

- `isOpen: boolean` - Panel visibility
- `settings: Settings` - Current settings
- `onClose: () => void` - Close callback
- `onSettingsChange: (settings: Settings) => void` - Update callback

**Features**:

- Slide-in from right animation
- Backdrop overlay
- Answer style selection (concise/balanced/detailed)
- Code preferences toggles
- Experimental features
- Verification mode toggle
- About section

---

## Citation Components

### CitationMarker

**Path**: `src/components/CitationMarker.tsx`
**Purpose**: Inline citation with hover tooltip
**Props**:

- `citation: Citation` - Citation data
- `index: number` - Citation number

**Features**:

- Clickable `[n]` marker
- Hover tooltip with:
  - MDN document title
  - Excerpt preview
  - "Open MDN" link
- Smooth fade-in animation
- Positioned tooltip (above marker)

---

### SourcesFooter

**Path**: `src/components/SourcesFooter.tsx`
**Purpose**: Expandable citations list
**Props**:

- `citations: Citation[]` - Array of citations

**Features**:

- Compact "Sources: [1] [2]" button
- Expandable to show full details
- Each citation shows:
  - Numbered badge
  - MDN title
  - Excerpt
  - Full link
- Smooth expand/collapse

---

## Custom Hooks

### useTheme

**Path**: `src/hooks/useTheme.ts`
**Returns**:

```typescript
{
  theme: Theme,
  setTheme: (theme: Theme) => void,
  resolvedTheme: 'light' | 'dark'
}
```

**Features**:

- Three-way theme: light, dark, system
- Persists to localStorage
- Syncs with system preference
- Updates DOM classes
- Provides resolved theme

---

### useLocalStorage

**Path**: `src/hooks/useLocalStorage.ts`
**Signature**: `<T>(key: string, initialValue: T)`
**Returns**: `[T, (value: T | ((val: T) => T)) => void]`

**Features**:

- Generic type support
- Auto-syncs to localStorage
- SSR-safe (checks for window)
- Error handling
- Supports function updates

---

## Type Definitions

### Message

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
  isPinned?: boolean;
  feedback?: "up" | "down" | null;
  feedbackReason?: string;
}
```

### Citation

```typescript
interface Citation {
  id: string;
  mdnTitle: string;
  mdnUrl: string;
  excerpt: string;
  sentenceIndex?: number;
}
```

### Conversation

```typescript
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isStarred?: boolean;
}
```

### Settings

```typescript
interface Settings {
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
```

### SavedAnswer

```typescript
interface SavedAnswer {
  messageId: string;
  conversationId: string;
  title: string;
  preview: string;
  savedAt: Date;
}
```

---

## Utility Functions

### cn

**Path**: `src/lib/utils.ts`
**Purpose**: Conditional class names

```typescript
cn(...inputs: ClassValue[]): string
```

### generateId

**Purpose**: Generate unique IDs

```typescript
generateId(): string // Returns timestamp-random combination
```

### formatTimestamp

**Purpose**: Human-readable time formatting

```typescript
formatTimestamp(date: Date): string
// Returns: "Just now", "5m ago", "2h ago", "3d ago", or full date
```

### truncate

**Purpose**: Truncate text with ellipsis

```typescript
truncate(text: string, maxLength: number): string
```

### extractCodeFromMessage

**Purpose**: Extract code blocks from markdown

```typescript
extractCodeFromMessage(content: string): string[]
```

---

## Component Communication

### Data Flow Pattern

```
page.tsx (state owner)
    ↓ props
Components (presentational)
    ↓ callbacks
page.tsx (state updates)
    ↓ props
Components (re-render)
```

### Example: Sending a Message

```typescript
InputBar
  → onSend(content)
  → page.tsx handleSendMessage()
  → Updates messages state
  → MessageList receives new messages
  → Renders UserMessage + AssistantMessage
```

### Example: Theme Change

```typescript
TopBar cycleTheme()
  → useTheme.setTheme()
  → Updates localStorage
  → Updates DOM classes
  → CSS variables change
  → All components update visually
```

---

## Import Paths

All components can be imported from the index:

```typescript
import { TopBar, Sidebar, MessageList } from "@/components";
```

Or individually:

```typescript
import { TopBar } from "@/components/TopBar";
```

Types:

```typescript
import type { Message, Citation, Settings } from "@/types";
```

Hooks:

```typescript
import { useTheme } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
```

Utils:

```typescript
import { cn, generateId, formatTimestamp } from "@/lib/utils";
```

---

## Testing Recommendations

### Unit Test Targets

- Utility functions (cn, generateId, formatTimestamp)
- Hooks (useTheme, useLocalStorage)
- Pure components (CitationMarker, TypingIndicator)

### Integration Test Targets

- Message flow (send → display → interact)
- Theme switching
- Settings persistence
- Conversation management

### E2E Test Targets

- Complete user journey
- Mobile responsiveness
- Keyboard navigation
- Accessibility

---

This reference provides quick access to all components, their purposes, and how they work together. For detailed implementation, see each component's source file.
