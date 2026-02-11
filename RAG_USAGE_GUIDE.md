# RAG Usage Guide

Complete guide for using the MDN Documentation RAG system with Anthropic Claude.

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Anthropic API Key (for Claude)
ANTHROPIC_API_KEY=sk-ant-xxx

# Voyage AI API Key (for embeddings)
VOYAGEAI_API_KEY=pa-xxx
# or
VOYAGE_API_KEY=pa-xxx

# Database
DATABASE_URL=postgresql://example:example@localhost:5455/example
```

### 2. Install Dependencies

Already installed:

- `@ai-sdk/anthropic` - Anthropic provider for Vercel AI SDK
- `ai` - Vercel AI SDK for streaming and embeddings
- `voyage-ai-provider` - Voyage AI embeddings

## CLI Usage

### Test Semantic Search (Retrieval Only)

```bash
# Basic search
npm run search "How do closures work?"

# With custom limit
npm run search "async/await" -- --limit=10
```

### Test Full RAG (Retrieval + Generation)

```bash
# Non-streaming (easier to read in CLI)
npm run ask "How do closures work in JavaScript?"

# Streaming mode (shows tokens as they arrive)
npm run ask "Explain async/await" -- --stream

# With custom options
npm run ask "What are promises?" -- --limit=10 --model=claude-3-opus-20240229
```

**Available Models:**

- `claude-3-opus-20240229` (most capable - Claude 3 Opus)
- `claude-3-sonnet-20240229` (Claude 3 Sonnet)
- `claude-3-haiku-20240307` (fastest - Claude 3 Haiku)

## API Usage

### Endpoint

```
POST /api/chat
```

### Request

```typescript
{
  "message": "How do closures work in JavaScript?"
}
```

### Response (Streaming)

The API returns a streaming response using the Vercel AI SDK data stream protocol.

**Custom Headers:**

- `X-Citations` - JSON array of citation objects
- `X-Chunks-Retrieved` - Number of chunks retrieved

## Frontend Integration

### Using `useChat` Hook (Recommended)

```typescript
'use client';

import { useChat } from 'ai/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  return (
    <div>
      {/* Messages */}
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about JavaScript..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

### Accessing Citations

```typescript
import { useChat } from "ai/react";
import { useEffect } from "react";

export function Chat() {
  const { messages, append } = useChat({
    api: "/api/chat",
    onResponse: (response) => {
      // Get citations from custom header
      const citations = response.headers.get("X-Citations");
      if (citations) {
        const citationData = JSON.parse(citations);
        console.log("Citations:", citationData);
        // Store in state or display to user
      }
    },
  });

  // ...rest of component
}
```

### Manual Streaming (Advanced)

```typescript
async function askQuestion(question: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: question }),
  });

  // Get citations from headers
  const citations = JSON.parse(response.headers.get("X-Citations") || "[]");

  // Stream the response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    console.log("Chunk:", chunk);
    // Process streaming chunk
  }
}
```

## How It Works

### 1. Retrieval (Semantic Search)

```typescript
// Generate embedding for user question
const questionEmbedding = await generateQuestionEmbedding(question);

// Search for similar chunks using vector similarity
const results = await searchSimilarChunks(questionEmbedding, limit);
```

**Vector Similarity:**

- Uses PostgreSQL pgvector with cosine distance
- Formula: `similarity = 1 - cosine_distance`
- Higher score = more similar (0-1 range)

### 2. Augmentation (Context Building)

```typescript
const context = buildContext(searchResults);
// Includes: title, source, heading, relevance score, content
```

### 3. Generation (Claude Response)

```typescript
const result = streamText({
  model: anthropic("claude-3-5-sonnet-20240620"),
  system: getSystemPrompt(), // MDN expert instructions
  messages: [
    {
      role: "user",
      content: `Context: ${context}\n\nQuestion: ${question}`,
    },
  ],
});
```

## Architecture

```
User Question
     ↓
[Generate Embedding] (Voyage AI voyage-code-3)
     ↓
[Vector Search] (PostgreSQL + pgvector)
     ↓
[Retrieve Top K Chunks] (default: 5)
     ↓
[Build Context] (format chunks for LLM)
     ↓
[Generate Response] (Claude 3.5 Sonnet)
     ↓
[Stream to User] (Vercel AI SDK)
```

## Performance Tuning

### Retrieval Parameters

```typescript
// Number of chunks to retrieve
const limit = 5; // Default, increase for more context

// Minimum similarity threshold
const threshold = 0.0; // 0 = no filter, 0.5 = only high relevance
```

### Generation Parameters

```typescript
{
  temperature: 0.3,  // Lower = more focused, higher = more creative
  maxTokens: 2048,   // Maximum response length
  model: "claude-3-5-sonnet-20240620" // Balance of speed/quality
}
```

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"

Add your Anthropic API key to `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-xxx
```

### "No relevant documentation found"

- Check if embeddings are ingested: `npm run db:studio`
- Try rephrasing the question
- Lower the similarity threshold

### Poor answer quality

- Increase the number of retrieved chunks (`--limit=10`)
- Try a more capable model (`claude-3-opus-20240229`)
- Check if retrieved chunks are actually relevant

### Slow responses

- Use a faster model (`claude-3-haiku-20240307`)
- Reduce the number of retrieved chunks
- Reduce `maxTokens`

## Testing Checklist

- [ ] Database is running (`npm run db:up`)
- [ ] Embeddings are generated (`npm run embed`)
- [ ] Data is ingested (`npm run ingest -- --from-embedded`)
- [ ] `ANTHROPIC_API_KEY` is set in `.env`
- [ ] `VOYAGEAI_API_KEY` is set in `.env`
- [ ] Semantic search works (`npm run search "test"`)
- [ ] RAG query works (`npm run ask "test"`)
- [ ] API endpoint returns streaming response

## Next Steps

1. **Enhance UI**: Add citation display, loading states, error handling
2. **Add Reranking**: Use Voyage reranker for better result ordering
3. **Implement Hybrid Search**: Combine vector + BM25 full-text search
4. **Add Conversation History**: Track multi-turn conversations
5. **Implement Caching**: Cache embeddings and responses

## References

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Voyage AI Docs](https://docs.voyageai.com/)
- [pgvector Docs](https://github.com/pgvector/pgvector)
