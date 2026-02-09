# Database Schemas

Organized database schemas for the RAG MDN application.

## Overview

The database is organized into two main schemas:

1. **Users Schema** (`users.ts`) - Authentication and chat management
2. **Documents Schema** (`documents.ts`) - RAG embeddings and search

## Schema Files

### `users.ts` - User Management

**Tables:**

#### `users`
- User accounts and authentication
- Supports both email/password and OAuth
- Tracks login history

**Fields:**
- `id` (UUID, primary key)
- `email` (unique, required)
- `name` (optional)
- `passwordHash` (for email/password auth)
- `emailVerified` (boolean)
- `provider`, `providerId` (for OAuth)
- `createdAt`, `lastLoginAt`, `updatedAt`

#### `sessions`
- Active user sessions
- Token-based authentication
- Automatic cleanup on user deletion

**Fields:**
- `id` (UUID, primary key)
- `userId` (foreign key to users)
- `token` (unique session token)
- `expiresAt` (expiration timestamp)
- `ipAddress`, `userAgent` (session metadata)
- `createdAt`

#### `chatConversations`
- User chat history organization
- Groups messages into conversations
- Auto-deletes with user

**Fields:**
- `id` (UUID, primary key)
- `userId` (foreign key to users)
- `title` (conversation title)
- `createdAt`, `updatedAt`

#### `chatMessages`
- Individual messages in conversations
- Stores user queries and AI responses
- Links to source chunks for citations

**Fields:**
- `id` (UUID, primary key)
- `conversationId` (foreign key)
- `role` ('user' or 'assistant')
- `content` (message text)
- `sources` (array of chunk IDs for citations)
- `createdAt`

### `documents.ts` - RAG Embeddings

**Tables:**

#### `documentEmbeddings`
- Stores chunked MDN documentation
- Vector embeddings for semantic search
- Rich metadata for filtering and citation

**Fields:**
- `id` (text, primary key) - Chunk ID
- `text` (text, required) - Chunk content
- `characterCount`, `wordCount` - Chunk metrics
- `embedding` (vector(1536)) - Vector for similarity search
- `metadata` (JSONB) - Full chunk metadata
- Individual metadata fields (source, lines, heading, etc.)
- `createdAt`, `updatedAt`

**Indexes:**
- `embedding_idx` - IVFFlat index for fast vector similarity
- `source_idx`, `slug_idx`, `pageType_idx` - Filtering
- `metadata_idx` - GIN index for JSONB queries

## Usage Examples

### Users Schema

```typescript
import { db } from "@/db";
import { users, sessions, chatConversations, chatMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

// Create a user
const newUser = await db.insert(users).values({
  email: "user@example.com",
  name: "John Doe",
  emailVerified: true,
}).returning();

// Create a session
await db.insert(sessions).values({
  userId: newUser[0].id,
  token: "secure-random-token",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
});

// Create a conversation
const conversation = await db.insert(chatConversations).values({
  userId: newUser[0].id,
  title: "JavaScript Closures Discussion",
}).returning();

// Add messages
await db.insert(chatMessages).values([
  {
    conversationId: conversation[0].id,
    role: "user",
    content: "What are closures in JavaScript?",
  },
  {
    conversationId: conversation[0].id,
    role: "assistant",
    content: "A closure is a combination of a function...",
    sources: ["closures_index_chunk_0", "closures_index_chunk_1"],
  },
]);

// Query user's conversations
const userConversations = await db
  .select()
  .from(chatConversations)
  .where(eq(chatConversations.userId, newUser[0].id))
  .orderBy(chatConversations.updatedAt);
```

### Documents Schema

```typescript
import { db } from "@/db";
import { documentEmbeddings } from "@/db/schema";
import { sql } from "drizzle-orm";

// Insert a chunk with embedding
await db.insert(documentEmbeddings).values({
  id: "closures_index_chunk_0",
  text: "A **closure** is...",
  characterCount: 703,
  wordCount: 96,
  embedding: [0.1, 0.2, 0.3, ...], // 1536 dimensions
  metadata: {
    source: "closures/index.md",
    chunkIndex: 0,
    startLine: 8,
    endLine: 8,
  },
  source: "closures/index.md",
  chunkIndex: 0,
  startLine: 8,
  endLine: 8,
  heading: "Introduction",
  headingLevel: 1,
  title: "Closures",
  slug: "Web/JavaScript/Guide/Closures",
  pageType: "guide",
  sidebar: "jssidebar",
});

// Semantic search
const queryEmbedding = [0.1, 0.2, ...]; // User query embedding

const results = await db.execute(sql`
  SELECT 
    id, text, source, heading, slug,
    1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
  FROM document_embeddings
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
  LIMIT 5
`);
```

## Relationships

```
users
  └─── sessions (1:many)
  └─── chatConversations (1:many)
         └─── chatMessages (1:many)
                └─── sources[] → documentEmbeddings.id

documentEmbeddings (independent)
```

## Database Diagram

```
┌─────────────────┐
│     users       │
│  - id (PK)      │
│  - email        │
│  - name         │
│  - password     │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
┌───▼───┐ ┌──▼──────────┐  │
│sessions│ │conversations │  │
└────────┘ └───┬──────────┘  │
               │             │
          ┌────▼────┐        │
          │messages │        │
          │         │        │
          │sources[]├────────┘
          └─────────┘        │
                             │
                    ┌────────▼─────────┐
                    │documentEmbeddings│
                    │  - id (PK)       │
                    │  - text          │
                    │  - embedding     │
                    └──────────────────┘
```

## Migration Strategy

### Development
```bash
# Push schema directly
npm run db:push
```

### Production
```bash
# Generate migrations
npm run db:generate

# Review generated SQL in drizzle/ folder

# Apply migrations
npm run db:migrate
```

## Type Safety

All schemas export TypeScript types:

```typescript
import type {
  User, NewUser,
  Session, NewSession,
  ChatConversation, NewChatConversation,
  ChatMessage, NewChatMessage,
  DocumentEmbedding, NewDocumentEmbedding,
} from "@/db/schema";

// Fully typed!
const user: User = {
  id: "...",
  email: "user@example.com",
  // TypeScript knows all fields
};
```

## Querying Across Schemas

```typescript
import { db } from "@/db";
import {
  users,
  chatConversations,
  chatMessages,
  documentEmbeddings,
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Get user with their conversations
const result = await db
  .select()
  .from(users)
  .leftJoin(chatConversations, eq(users.id, chatConversations.userId))
  .where(eq(users.email, "user@example.com"));

// Get conversation with messages and their sources
const conversation = await db
  .select()
  .from(chatMessages)
  .where(eq(chatMessages.conversationId, conversationId));

// For each message, fetch referenced chunks
for (const message of conversation) {
  if (message.sources && message.sources.length > 0) {
    const chunks = await db
      .select()
      .from(documentEmbeddings)
      .where(sql`${documentEmbeddings.id} = ANY(${message.sources})`);
  }
}
```

## Next Steps

1. Start database: `npm run db:up`
2. Push schemas: `npm run db:push`
3. Verify tables: `npm run db:connect` then `\dt`
4. Create seed data (optional)
5. Implement embedding generation script
