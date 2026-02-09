# Database Seeding & Testing Guide

How to populate your database with test data and view it in Drizzle Studio.

## Quick Start

### 1. Ensure Database is Running

```bash
npm run db:status
```

If not running:
```bash
npm run db:up
```

### 2. Push Schema (First Time Only)

```bash
npm run db:push
```

Select **"Yes, I want to execute all statements"** when prompted.

### 3. Seed Test Data

```bash
npm run db:seed
```

This will create:
- ✅ 1 test user (test@example.com)
- ✅ 1 active session
- ✅ 1 conversation
- ✅ 4 chat messages (with Q&A about closures)
- ✅ 5 document chunks (from closures documentation with mock embeddings)

### 4. View in Drizzle Studio

```bash
npm run db:studio
```

This will:
1. Start Drizzle Studio server
2. Automatically open browser at `https://local.drizzle.studio`
3. Show all tables and data in a visual interface

## What Gets Seeded

### Users Table

```
Email: test@example.com
Name: Test User
Email Verified: true
Created At: [timestamp]
```

### Sessions Table

```
Token: test-session-token-12345
Expires: 7 days from now
IP: 127.0.0.1
User Agent: Mozilla/5.0 (Test Browser)
```

### Chat Conversations

```
Title: JavaScript Closures Discussion
User: test@example.com
```

### Chat Messages (4 messages)

1. **User**: "What are closures in JavaScript?"
2. **Assistant**: Definition with sources
3. **User**: "Can you give me an example?"
4. **Assistant**: Code example with sources

### Document Embeddings (5 chunks)

Sample chunks from `closures/index.md`:
- closures_index_chunk_0
- closures_index_chunk_1
- closures_index_chunk_2
- closures_index_chunk_3
- closures_index_chunk_4

Each includes:
- Full text content
- Mock embeddings (1536 dimensions)
- Complete metadata (source, lines, heading, etc.)

## Testing Queries

### Run Test Script

```bash
npm run db:test
```

Shows:
- All users
- All conversations
- Messages in first conversation
- Document chunks (first 10)
- Database statistics

### Manual Queries in psql

```bash
npm run db:connect
```

Then try:

```sql
-- Count tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM document_embeddings;

-- View user data
SELECT email, name, created_at FROM users;

-- View conversations with message counts
SELECT 
  c.title,
  COUNT(m.id) as message_count
FROM chat_conversations c
LEFT JOIN chat_messages m ON m.conversation_id = c.id
GROUP BY c.id, c.title;

-- View chunks with metadata
SELECT 
  id,
  source,
  heading,
  character_count,
  word_count,
  CASE WHEN embedding IS NOT NULL THEN '✅' ELSE '❌' END as has_embedding
FROM document_embeddings
LIMIT 5;

-- Test vector similarity (mock query)
SELECT 
  id,
  heading,
  1 - (embedding <=> (SELECT embedding FROM document_embeddings LIMIT 1)) as similarity
FROM document_embeddings
WHERE embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT 3;
```

## Drizzle Studio Features

Once you run `npm run db:studio`, you can:

### Browse Tables
- Click any table name in the sidebar
- View all rows
- Search and filter data
- Sort by columns

### View Relationships
- See foreign key relationships
- Click to navigate between related records
- Visualize data connections

### Edit Data
- Click any cell to edit
- Add new rows
- Delete rows
- Changes are saved automatically

### Run Queries
- SQL tab for custom queries
- View query results
- Export data

### Inspect Metadata
- View table schemas
- See indexes
- Check constraints

## Useful Studio Views

### Users Dashboard
1. Click **users** table
2. See test@example.com user
3. Click the user ID to see related sessions and conversations

### Conversations
1. Click **chat_conversations** table
2. See "JavaScript Closures Discussion"
3. Click conversation ID to see messages

### Messages with Sources
1. Click **chat_messages** table
2. See assistant messages
3. Check **sources** column (array of chunk IDs)
4. Click chunk IDs to see referenced documents

### Document Embeddings
1. Click **document_embeddings** table
2. See chunked content
3. View metadata (JSONB column)
4. Check embedding vectors (1536 dimensions!)

## Resetting Data

### Clear All Data, Keep Schema

```sql
-- In psql
TRUNCATE users, sessions, chat_conversations, chat_messages, document_embeddings CASCADE;
```

Or use seed script again:
```bash
npm run db:seed
```

### Full Reset (Schema + Data)

```bash
npm run db:reset
npm run db:push
npm run db:seed
```

## Adding More Test Data

Edit `scripts/seed-db.ts` to add:

```typescript
// More users
const users = await db.insert(users).values([
  { email: "user1@example.com", name: "User 1" },
  { email: "user2@example.com", name: "User 2" },
]).returning();

// More conversations
const conversations = await db.insert(chatConversations).values([
  { userId: users[0].id, title: "Arrays Tutorial" },
  { userId: users[1].id, title: "Promises Guide" },
]).returning();
```

## Production Considerations

### Mock vs Real Embeddings

**Current (Mock):**
```typescript
const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
```

**Production (Real):**
```typescript
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: chunk.text,
});

const embedding = response.data[0].embedding;
```

### Bulk Seeding

For all 1,125 chunks:
```bash
# Create production embedding script (coming next)
npm run embed
```

## Troubleshooting

### "Cannot find chunks file"

Run chunking first:
```bash
npm run chunk
```

### "Database connection refused"

Start database:
```bash
npm run db:up
npm run db:status
```

### "Tables don't exist"

Push schema:
```bash
npm run db:push
```

### Drizzle Studio won't start

Check port 4983 is available:
```bash
lsof -i :4983
```

## Next Steps

1. ✅ Seed database: `npm run db:seed`
2. ✅ View in Studio: `npm run db:studio`
3. ✅ Test queries: `npm run db:test`
4. 🔨 Create real embedding generation script
5. 🔨 Populate all 1,125 chunks
6. 🔨 Implement semantic search in chat backend
