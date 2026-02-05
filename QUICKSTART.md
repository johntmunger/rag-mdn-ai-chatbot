# Quick Start Guide

Get the JS Assistant chat interface up and running in minutes.

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
cd rag-mdn
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Try the Welcome Screen

- Click any of the example prompts to see how the chat works
- Each prompt fills the input and sends automatically

### 2. Test the Chat Interface

- Type a question about JavaScript
- Press `Enter` to send (or click the send button)
- Watch the typing indicator, then see the formatted response

### 3. Interact with Messages

- **Hover** over assistant messages to see the action toolbar
- **Copy** the entire response
- **Thumbs up/down** to provide feedback
- **Regenerate** to get a new response
- **Pin** to save to your favorites

### 4. Explore Code Features

- Look at code blocks in responses
- Click **Copy** to copy code to clipboard
- Toggle **Wrap** for long lines
- Click **Run** (placeholder) to see the execution modal

### 5. Browse Conversations

- Click the **menu icon** (mobile) or see the sidebar (desktop)
- Past conversations are automatically saved
- Star your favorites
- View pinned answers in the "Saved Answers" section

### 6. Customize Settings

- Click the **gear icon** in the top bar
- Choose answer style: Concise, Balanced, or Detailed
- Toggle code preferences
- Enable experimental features
- Try verification mode to highlight MDN-backed statements

### 7. Switch Themes

- Click the **theme toggle** in the top bar
- Cycles through: Light → Dark → System
- Theme preference is saved automatically

## Key Features to Test

### Message Actions

```
1. Send a question
2. Hover over the assistant response
3. Try each action: Copy, 👍, 👎, Regenerate, Pin
```

### Code Interaction

```
1. Send: "Show me a promise example"
2. In the response, find the code block
3. Click the Copy button
4. Toggle the Wrap button
5. Click Run to see the playground modal
```

### Conversation Management

```
1. Start a new conversation (New Chat button)
2. Switch between conversations
3. Star a conversation
4. Pin an answer
5. View saved answers
```

### Citations

```
1. Look for [1] [2] markers in responses
2. Hover over a marker to see the MDN tooltip
3. Click "Sources: [1] [2]" at the bottom to expand
4. Click MDN links to view full documentation
```

## Demo Data

The app comes with:

- 2 sample conversations in the sidebar
- Demo responses with code examples
- Mock MDN citations

All are for UI demonstration. Replace with real backend integration for production.

## Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line in input
- `Escape` - Close modals/drawers
- `Tab` - Navigate between interactive elements

## Mobile Testing

The interface is responsive:

- Sidebar becomes a slide-out drawer
- Code blocks scroll horizontally
- Touch-friendly button sizes
- Mobile keyboard support

Test on:

- Mobile browser (Chrome, Safari)
- Tablet (portrait and landscape)
- Different screen sizes

## What's Next?

### For Development

1. Connect to a real AI backend
2. Implement MDN RAG pipeline
3. Add streaming response support
4. Implement code execution

### For Customization

1. Edit example prompts in `EmptyState.tsx`
2. Customize colors in `globals.css`
3. Add new settings in `SettingsPanel.tsx`
4. Extend message actions in `AssistantMessage.tsx`

## Troubleshooting

### Port Already in Use

```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check for type issues
npm run build
```

### Linting Issues

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

## Project Structure Quick Reference

```
src/
├── app/
│   ├── page.tsx          ← Main app logic
│   └── globals.css       ← Theme variables
├── components/
│   ├── TopBar.tsx        ← Header
│   ├── Sidebar.tsx       ← History sidebar
│   ├── MessageList.tsx   ← Message container
│   ├── InputBar.tsx      ← Message input
│   └── ...               ← Other components
├── hooks/
│   ├── useTheme.ts       ← Theme hook
│   └── useLocalStorage.ts ← Persistence hook
├── types/
│   └── index.ts          ← TypeScript types
└── lib/
    └── utils.ts          ← Utility functions
```

## Learn More

- [README.md](./README.md) - Full feature list and architecture
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Deep dive into implementation
- [Next.js Docs](https://nextjs.org/docs) - Framework documentation

## Need Help?

Check the implementation files for inline comments and examples. All components are well-documented with clear prop interfaces.

Happy coding! 🚀
