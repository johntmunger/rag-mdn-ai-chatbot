# Implementation Guide

This document provides a detailed overview of the design decisions, component architecture, and implementation details of the JS Assistant chat interface.

## Design Philosophy

### 1. Code-First Experience

The interface prioritizes code readability and interaction:

- **Large, readable code blocks** with syntax highlighting
- **Line numbers** for easy reference
- **Copy buttons** with visual feedback
- **Optional code execution** (placeholder for future)
- **Wrap toggle** for long lines

### 2. Subtle MDN Integration

Citations are present but non-intrusive:

- **Inline markers** `[n]` at sentence level, not prominent
- **Hover tooltips** for quick preview
- **Expandable footer** for full citation details
- **No MDN branding** in the main UI
- **Optional verification mode** to highlight verified statements

### 3. ChatGPT-Inspired UX

Familiar patterns for easy adoption:

- **Central conversation pane** as primary focus
- **Left sidebar** for history (collapsible)
- **Bottom input bar** that's always accessible
- **Streaming responses** with typing indicators
- **Message actions** on hover

### 4. Developer-Centric Design

Built for developers by developers:

- **Dark and light themes** with system preference
- **IDE-like aesthetics** (monospace fonts, neutral colors)
- **Keyboard shortcuts** (Enter to send, Shift+Enter for newline)
- **Fast, responsive** interactions
- **Minimal visual noise**

## Component Architecture

### State Management

The application uses React hooks for state management:

```typescript
// Main state in page.tsx
const [conversations, setConversations] = useLocalStorage<Conversation[]>(
  "conversations",
  []
);
const [currentConversationId, setCurrentConversationId] = useState<
  string | null
>(null);
const [savedAnswers, setSavedAnswers] = useLocalStorage<SavedAnswer[]>(
  "savedAnswers",
  []
);
const [settings, setSettings] = useLocalStorage<Settings>(
  "settings",
  defaultSettings
);
const [isGenerating, setIsGenerating] = useState(false);
```

**Why this approach?**

- `useLocalStorage`: Persists data across sessions without backend
- Simple prop drilling: Easy to understand and debug
- Single source of truth: Main page owns all state
- Future-ready: Easy to replace with Context/Redux when needed

### Component Hierarchy

```
App (page.tsx)
├── TopBar
│   ├── Menu button (mobile)
│   ├── Brand/Logo
│   ├── Theme toggle
│   └── Settings button
├── Sidebar (collapsible)
│   ├── New Chat button
│   ├── Conversations list
│   └── Saved Answers section
├── Main Chat Area
│   ├── EmptyState (when no messages)
│   │   ├── Welcome message
│   │   └── Example prompts (clickable)
│   └── MessageList (with messages)
│       ├── UserMessage (right-aligned)
│       ├── AssistantMessage (full-width)
│       │   ├── Markdown content
│       │   ├── CodeBlock(s)
│       │   ├── CitationMarker(s)
│       │   ├── SourcesFooter
│       │   └── Hover toolbar
│       └── TypingIndicator (while generating)
├── InputBar (sticky bottom)
│   ├── Quick suggestions
│   ├── Textarea (auto-resize)
│   ├── Send button
│   └── Code snippet button
└── SettingsPanel (overlay)
    ├── Answer style
    ├── Code preferences
    ├── Experimental features
    └── Verification mode
```

### Key Components Deep Dive

#### AssistantMessage

The most complex component, handling:

```typescript
// Hover state for toolbar
const [isHovered, setIsHovered] = useState(false);

// Expandable long messages
const [isExpanded, setIsExpanded] = useState(true);
const isLongMessage = message.content.length > 2000;

// Feedback collection
const [showFeedbackReason, setShowFeedbackReason] = useState(false);
```

**Markdown Rendering**:

- Uses `react-markdown` with `rehype-highlight` for syntax highlighting
- Custom components for each markdown element
- Special handling for code blocks (inline vs block)

**Citation Integration**:

- Parses content for citation markers
- Shows hover tooltips via `CitationMarker` component
- Collects all citations in expandable `SourcesFooter`

#### CodeBlock

Enhanced code display with multiple features:

```typescript
// State for interactive features
const [isCopied, setIsCopied] = useState(false); // Copy feedback
const [isWrapped, setIsWrapped] = useState(false); // Wrap toggle
const [showPlayground, setShowPlayground] = useState(false); // Modal
```

**Line Numbers**:

```typescript
{
  lines.map((line, i) => (
    <div key={i} className="table-row">
      <span className="table-cell select-none pr-4 text-right w-8">
        {i + 1}
      </span>
      <span className="table-cell">{line || "\n"}</span>
    </div>
  ));
}
```

Uses CSS table display for perfect line number alignment.

#### InputBar

Multi-line input with auto-resize:

```typescript
// Auto-resize textarea based on content
useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }
}, [input]);
```

**Cycling Placeholders**:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentPlaceholder((prev) => {
      const currentIndex = placeholders.indexOf(prev);
      const nextIndex = (currentIndex + 1) % placeholders.length;
      return placeholders[nextIndex];
    });
  }, 3000);
  return () => clearInterval(interval);
}, []);
```

Engages users with varied hints about what they can ask.

#### MessageList

Handles scrolling and auto-scroll behavior:

```typescript
// Track user scroll intent
const [userScrolled, setUserScrolled] = useState(false);

// Auto-scroll to bottom unless user scrolled up
useEffect(() => {
  if (!userScrolled && scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [messages, isGenerating, userScrolled]);
```

**Scroll to Bottom Button**:
Shows when user scrolls up, letting them jump back to latest message.

### Theme System

Implements a three-way theme system:

```typescript
type Theme = "light" | "dark" | "system";

// In useTheme hook
if (theme === "system") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const updateTheme = () => {
    const isDark = mediaQuery.matches;
    setResolvedTheme(isDark ? "dark" : "light");
  };
  mediaQuery.addEventListener("change", updateTheme);
}
```

**CSS Custom Properties**:
All colors defined as CSS variables for easy theme switching:

```css
:root {
  --accent: #0ea5e9;
  --background: #ffffff;
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --accent: #0ea5e9;
    --background: #09090b;
    /* ... */
  }
}
```

Changes propagate instantly across all components.

## Styling Approach

### Tailwind CSS v4

Uses the latest Tailwind with CSS-first configuration:

```css
@theme inline {
  --color-accent: var(--accent);
  --font-sans: var(--font-geist-sans);
  /* ... */
}
```

**Why Tailwind?**

- Rapid development with utility classes
- Consistent spacing and sizing
- Built-in responsive design
- Easy to customize via CSS variables

### Custom Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

Subtle animations enhance perceived performance without being distracting.

## Data Flow

### Message Lifecycle

1. **User types and sends**:

   ```
   InputBar → handleSendMessage() → Creates user message
   ```

2. **Add to conversation**:

   ```
   updateConversationMessages() → Updates state → Triggers re-render
   ```

3. **Generate AI response**:

   ```
   simulateAIResponse() → Shows TypingIndicator
   ```

4. **Stream response** (future):

   ```
   API call → Chunk-by-chunk updates → Smooth rendering
   ```

5. **Add citations**:
   ```
   Parse response → Extract MDN references → Create Citation objects
   ```

### Conversation Management

```typescript
// Create new conversation
const newConversation: Conversation = {
  id: generateId(),
  title: content.slice(0, 50), // Auto-generate from first message
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Update conversation
const updateConversationMessages = (conversationId, newMessages) => {
  setConversations(
    conversations.map((conv) =>
      conv.id === conversationId
        ? { ...conv, messages: newMessages, updatedAt: new Date() }
        : conv
    )
  );
};
```

### Local Storage Persistence

```typescript
// useLocalStorage hook
const [storedValue, setStoredValue] = useState<T>(initialValue);

const setValue = (value: T | ((val: T) => T)) => {
  const valueToStore = value instanceof Function ? value(storedValue) : value;
  setStoredValue(valueToStore);
  window.localStorage.setItem(key, JSON.stringify(valueToStore));
};
```

Automatically syncs state to localStorage for persistence.

## Integration Points

### Backend API Integration

Replace the `simulateAIResponse` function:

```typescript
const handleSendMessage = async (content: string) => {
  // Add user message to UI
  const userMessage = createUserMessage(content);
  addMessageToConversation(userMessage);

  // Call your API
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: content,
      conversationHistory: messages,
      settings: settings,
    }),
  });

  // Handle streaming
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let assistantMessage = createAssistantMessage("");
  addMessageToConversation(assistantMessage);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    assistantMessage.content += chunk;
    updateMessageContent(assistantMessage.id, assistantMessage.content);
  }
};
```

### MDN RAG Pipeline

Expected backend structure:

```
1. Index MDN documentation
   - Parse MDN docs into chunks
   - Generate embeddings
   - Store in vector database

2. Query handling
   - User query → Generate embedding
   - Vector search → Retrieve relevant chunks
   - Pass to LLM as context

3. Citation tracking
   - LLM returns response with [citation_id] markers
   - Map citation_ids to MDN chunks
   - Return citations with response

4. Frontend integration
   - Receive response with citations
   - Parse citation markers
   - Display inline and in footer
```

### Code Execution

For the "Run" button in CodeBlock:

```typescript
// Sandbox approach
const executeCode = async (code: string) => {
  try {
    // Option 1: Web Worker (safe, limited)
    const worker = new Worker("code-executor.js");
    worker.postMessage(code);

    // Option 2: iframe sandbox (more features)
    const iframe = document.createElement("iframe");
    iframe.sandbox = "allow-scripts";

    // Option 3: Backend execution (safest)
    const result = await fetch("/api/execute", {
      method: "POST",
      body: JSON.stringify({ code }),
    });

    return result.output;
  } catch (error) {
    return { error: error.message };
  }
};
```

## Performance Considerations

### Optimizations Implemented

1. **Lazy rendering**: Long messages are truncated with expand button
2. **Smooth scrolling**: Auto-scroll only when user hasn't scrolled up
3. **Debounced input**: Textarea auto-resize uses requestAnimationFrame
4. **Memoization ready**: Components structured for React.memo if needed

### Future Optimizations

1. **Virtual scrolling**: For conversations with 100+ messages
2. **Code splitting**: Lazy load SettingsPanel, CodePlayground
3. **Image lazy loading**: If adding support for images in messages
4. **Service worker**: For offline support and caching

## Testing Strategy

Recommended test coverage:

### Unit Tests

- Utility functions (`generateId`, `formatTimestamp`, `truncate`)
- Custom hooks (`useTheme`, `useLocalStorage`)
- Pure components (`CitationMarker`, `TypingIndicator`)

### Integration Tests

- Message flow (send → display → interact)
- Conversation management (create, switch, star)
- Settings persistence (theme, preferences)

### E2E Tests

- Complete user journey (land → ask question → get answer → interact)
- Theme switching across components
- Mobile responsive behavior

## Accessibility

### Implemented

- Semantic HTML (`<main>`, `<aside>`, `<nav>`)
- ARIA labels on icon buttons
- Keyboard navigation (Tab, Enter, Escape)
- Focus indicators (`:focus-visible`)
- Color contrast (WCAG AA compliant)

### Future Improvements

- Screen reader announcements for new messages
- Keyboard shortcuts modal (Cmd+K)
- High contrast mode
- Reduced motion preference support

## Mobile Responsiveness

### Current Implementation

- **Sidebar**: Full-screen overlay on mobile with backdrop
- **TopBar**: Shows menu button on mobile
- **Input**: Adjusts for mobile keyboards
- **Code blocks**: Horizontal scroll on small screens

### Future Enhancements

- Touch gestures (swipe to open sidebar)
- Mobile-optimized code viewer
- Bottom sheet for settings on mobile
- Pull-to-refresh for conversations

## Customization Guide

### Adding New Theme

1. Define colors in `globals.css`:

   ```css
   .theme-ocean {
     --background: #0c1821;
     --accent: #06ffa5;
     /* ... */
   }
   ```

2. Update `useTheme` hook to include new option

3. Add to settings radio buttons

### Adding New Message Action

1. Add button to `AssistantMessage` toolbar
2. Create handler function in `page.tsx`
3. Pass handler as prop to `AssistantMessage`
4. Update `Message` type if storing action state

### Adding New Settings Option

1. Update `Settings` type in `types/index.ts`
2. Add UI in `SettingsPanel.tsx`
3. Use setting in relevant component
4. Update default settings in `page.tsx`

## Conclusion

This implementation provides a solid foundation for a JavaScript Q&A chat interface. The component architecture is modular and maintainable, making it easy to:

- Add new features
- Customize styling
- Integrate with backends
- Extend functionality

The design prioritizes developer experience while keeping the MDN integration subtle and verification-oriented, not brand-focused.
