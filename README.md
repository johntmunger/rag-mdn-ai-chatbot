# JS Assistant - JavaScript Q&A Chat Interface

A modern, ChatGPT-like chat interface specifically designed for JavaScript Q&A, featuring excellent code snippet support and subtle MDN-backed validation.

## Features

### Core Experience

- **Clean Chat Interface**: ChatGPT-inspired layout optimized for JavaScript developers
- **Code-First Design**: Syntax highlighting, line numbers, copy/run functionality
- **Subtle Citations**: MDN documentation integration that doesn't dominate the UI
- **Dark/Light Themes**: Full theme support with system preference detection

### Chat Features

- **Streaming Responses**: Real-time message generation with typing indicators
- **Message Actions**: Copy, feedback (thumbs up/down), regenerate, and pin messages
- **Smart Input**: Multi-line textarea with Enter to send, Shift+Enter for newline
- **Quick Suggestions**: Context-aware follow-up prompts
- **Conversation History**: Sidebar with searchable past conversations
- **Saved Answers**: Pin and save important answers for quick reference

### Code Features

- **Syntax Highlighting**: JavaScript, TypeScript, HTML, CSS, and more
- **Interactive Code Blocks**:
  - Copy to clipboard
  - Line numbers
  - Text wrapping toggle
  - Run JavaScript code (placeholder for future implementation)
- **Markdown Support**: Full markdown rendering with GFM support

### Settings & Customization

- **Answer Style**: Concise, Balanced, or Detailed responses
- **Code Preferences**:
  - Prefer modern ES6+ syntax
  - Show TypeScript variations
- **Experimental Features**:
  - Step-by-step explanations
  - Browser compatibility notes
- **Verification Mode**: Highlight MDN-verified statements

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **Markdown**: react-markdown with rehype-highlight
- **Icons**: lucide-react
- **TypeScript**: Full type safety throughout

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout with fonts and metadata
│   ├── page.tsx         # Main chat interface
│   └── globals.css      # Global styles and theme variables
├── components/
│   ├── TopBar.tsx       # Header with branding and controls
│   ├── Sidebar.tsx      # Conversation history and saved answers
│   ├── EmptyState.tsx   # Welcome screen with example prompts
│   ├── MessageList.tsx  # Scrollable message container
│   ├── UserMessage.tsx  # User message bubble
│   ├── AssistantMessage.tsx  # AI response with actions
│   ├── CodeBlock.tsx    # Syntax-highlighted code with controls
│   ├── InputBar.tsx     # Message input with suggestions
│   ├── TypingIndicator.tsx   # Animated "thinking" indicator
│   ├── SettingsPanel.tsx     # Settings drawer
│   ├── CitationMarker.tsx    # Inline MDN citation tooltips
│   └── SourcesFooter.tsx     # Expandable sources list
├── hooks/
│   ├── useTheme.ts      # Theme management hook
│   └── useLocalStorage.ts    # Persistent state hook
├── lib/
│   └── utils.ts         # Utility functions (cn, generateId, etc.)
└── types/
    └── index.ts         # TypeScript type definitions
```

## Component Architecture

### Layout Components

- **TopBar**: App branding, theme toggle, settings button
- **Sidebar**: Collapsible conversation history with favorites
- **EmptyState**: Engaging welcome screen with example prompts

### Message Components

- **UserMessage**: Right-aligned user input with markdown support
- **AssistantMessage**: Full-width AI response with:
  - Hover toolbar (copy, feedback, regenerate, pin)
  - Markdown rendering with syntax highlighting
  - Expandable for long messages
  - Citations footer

### Input & Interaction

- **InputBar**: Auto-resizing textarea with:
  - Cycling placeholder hints
  - Quick suggestion chips
  - Send button (disabled while generating)
  - Keyboard shortcuts
- **TypingIndicator**: Animated dots during generation

### Code Features

- **CodeBlock**: Enhanced code display with:
  - Language indicator
  - Line numbers
  - Copy button with feedback
  - Wrap toggle
  - Optional playground modal

### Citations & Verification

- **CitationMarker**: Inline `[n]` markers with hover tooltips
- **SourcesFooter**: Compact "Sources: [1] [2]" with expandable details

## Customization

### Theme Colors

Edit `src/app/globals.css` to customize theme colors:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --accent: #0ea5e9;
  /* ... more variables */
}
```

### Example Prompts

Edit `src/components/EmptyState.tsx` to customize welcome prompts:

```typescript
const examplePrompts = [
  { title: "...", prompt: "..." },
  // Add your own prompts
];
```

### Placeholder Hints

Edit `src/components/InputBar.tsx` to customize cycling placeholders:

```typescript
const placeholders = [
  "Ask about closures...",
  // Add your own hints
];
```

## Backend Integration

This is currently a **UI-only implementation** with simulated responses. To connect to a real backend:

1. **Replace `simulateAIResponse`** in `src/app/page.tsx` with actual API calls
2. **Implement RAG pipeline** with MDN documentation indexing
3. **Add streaming support** for real-time response generation
4. **Connect citation system** to your MDN retrieval logic

Example integration point:

```typescript
const handleSendMessage = async (content: string) => {
  // Your API call here
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: content, settings }),
  });

  // Handle streaming response
  const reader = response.body.getReader();
  // ... stream chunks and update UI
};
```

## Design Principles

1. **Code-First**: Optimized for reading, copying, and understanding code
2. **Subtle Citations**: MDN as verification, not branding
3. **Developer-Friendly**: IDE-like aesthetics, keyboard shortcuts
4. **Fast & Responsive**: Smooth animations, optimistic updates
5. **Accessible**: Proper ARIA labels, keyboard navigation

## Future Enhancements

- [ ] Real AI backend integration with streaming
- [ ] MDN RAG pipeline implementation
- [ ] Code playground with live execution
- [ ] Export conversations as markdown
- [ ] Search within conversations
- [ ] Keyboard shortcuts modal
- [ ] Mobile responsiveness improvements
- [ ] Voice input support
- [ ] Code diff view for edits

## Known Issues

- Network interface detection error in sandbox environments (non-fatal)
- Code playground is UI-only (needs backend for execution)
- Citations are mock data (needs MDN RAG integration)

## License

MIT

## Contributing

Contributions welcome! This is a reference implementation that can be adapted for various use cases beyond JavaScript Q&A.
