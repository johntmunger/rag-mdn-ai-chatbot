# Drizzle ORM Setup Guide

Type-safe database interactions with PostgreSQL and pgvector using Drizzle ORM.

## Overview

Drizzle provides:
- ✅ Type-safe queries with full TypeScript support
- ✅ Schema migrations with version control
- ✅ Support for custom types (pgvector)
- ✅ Zero-cost abstraction (minimal runtime overhead)
- ✅ Drizzle Studio for visual database management

## Setup Complete

### Installed Dependencies

```json
{
  "drizzle-orm": "^latest",
  "drizzle-kit": "^latest",
  "postgres": "^latest"
}
```

### Configuration Files

1. **`drizzle.config.ts`** - Drizzle Kit configuration
2. **`src/db/schema.ts`** - Database schema with pgvector support
3. **`src/db/index.ts`** - Database client and connection

## Quick Start

### 1. Start Database

```bash
npm run db:up
```

### 2. Push Schema to Database

```bash
# Push schema directly (for development)
npm run db:push

# Or generate and run migrations (for production)
npm run db:generate
npm run db:migrate
```

### 3. Verify Setup

```bash
# Connect to database
npm run db:connect

# In psql, check tables:
\dt

# Check if pgvector is enabled:
\dx vector
```

## Database Schema

### Table: `document_embeddings`

```typescript
{
  // Primary fields
  id: string;                    // Primary key
  text: string;                  // Chunk content
  characterCount: number;        // Character count
  wordCount: number;             // Word count
  embedding: number[] | null;    // Vector embedding (1536 dimensions)
  
  // Full metadata
  metadata: object;              // JSONB with all chunk metadata
  
  // Extracted fields for filtering
  source: string;                // Source file path
  chunkIndex: number;            // Position in document
  startLine: number;             // Start line in source
  endLine: number;               // End line in source
  heading: string | null;        // Section heading
  headingLevel: number | null;   // Heading depth (1-6)
  title: string | null;          // Document title
  slug: string | null;           // MDN slug
  pageType: string | null;       // Page type (guide, reference)
  sidebar: string | null;        // Sidebar reference
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes

- **embedding_idx** - IVFFlat index for fast vector similarity search
- **source_idx** - Filter by source file
- **slug_idx** - Filter by MDN slug
- **page_type_idx** - Filter by page type
- **heading_idx** - Filter by heading
- **metadata_idx** - GIN index for flexible JSONB queries

## NPM Scripts

### Database Management

```bash
# Start/stop database
npm run db:up
npm run db:down
npm run db:reset

# Check status
npm run db:status
npm run db:logs
npm run db:connect
```

### Schema Management

```bash
# Push schema to database (development)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
```

## Using Drizzle in Your Code

### Import Database Client

```typescript
import { db } from "@/db";
import { documentEmbeddings } from "@/db/schema";
```

### Insert Embeddings

```typescript
import { db } from "@/db";
import { documentEmbeddings } from "@/db/schema";

// Insert single chunk with embedding
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
    heading: "Introduction",
    headingLevel: 1,
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
```

### Bulk Insert (Batch)

```typescript
// Insert multiple chunks at once
const chunks = [/* your chunk data */];

await db.insert(documentEmbeddings).values(
  chunks.map(chunk => ({
    id: chunk.id,
    text: chunk.text,
    characterCount: chunk.characterCount,
    wordCount: chunk.wordCount,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
    source: chunk.metadata.source,
    chunkIndex: chunk.metadata.chunkIndex,
    startLine: chunk.metadata.startLine,
    endLine: chunk.metadata.endLine,
    heading: chunk.metadata.heading,
    headingLevel: chunk.metadata.headingLevel,
    title: chunk.metadata.title,
    slug: chunk.metadata.slug,
    pageType: chunk.metadata.pageType,
    sidebar: chunk.metadata.sidebar,
  }))
);
```

### Upsert (Insert or Update)

```typescript
await db
  .insert(documentEmbeddings)
  .values(chunkData)
  .onConflictDoUpdate({
    target: documentEmbeddings.id,
    set: {
      embedding: sql`EXCLUDED.embedding`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    },
  });
```

### Vector Similarity Search

```typescript
import { sql } from "drizzle-orm";

// Find similar chunks using cosine similarity
const queryEmbedding = [0.1, 0.2, 0.3, ...]; // Your query embedding

const results = await db
  .select({
    id: documentEmbeddings.id,
    text: documentEmbeddings.text,
    source: documentEmbeddings.source,
    heading: documentEmbeddings.heading,
    slug: documentEmbeddings.slug,
    similarity: sql<number>`1 - (${documentEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
  })
  .from(documentEmbeddings)
  .orderBy(sql`${documentEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
  .limit(5);
```

### Filtered Search

```typescript
// Search only in specific source files
const results = await db
  .select()
  .from(documentEmbeddings)
  .where(
    sql`${documentEmbeddings.source} = 'functions/index.md'
        AND ${documentEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector < 0.5`
  )
  .orderBy(sql`${documentEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
  .limit(5);
```

### Query by Metadata

```typescript
import { eq, and, like } from "drizzle-orm";

// Find all chunks from a specific heading
const chunks = await db
  .select()
  .from(documentEmbeddings)
  .where(eq(documentEmbeddings.heading, "Closures"));

// Find all chunks from JavaScript guide
const jsGuideChunks = await db
  .select()
  .from(documentEmbeddings)
  .where(like(documentEmbeddings.slug, "Web/JavaScript/Guide/%"));

// Complex filtering
const results = await db
  .select()
  .from(documentEmbeddings)
  .where(
    and(
      eq(documentEmbeddings.pageType, "guide"),
      eq(documentEmbeddings.headingLevel, 2)
    )
  );
```

### Get Statistics

```typescript
import { count, avg, min, max } from "drizzle-orm";

const stats = await db
  .select({
    totalChunks: count(),
    avgCharacters: avg(documentEmbeddings.characterCount),
    avgWords: avg(documentEmbeddings.wordCount),
  })
  .from(documentEmbeddings);
```

## Drizzle Studio

Visual database browser:

```bash
# Start Drizzle Studio
npm run db:studio

# Opens browser at https://local.drizzle.studio
```

Features:
- Browse tables and data
- Run queries
- Edit records
- View relationships

## Migrations

### Generate Migration

```bash
# After changing schema.ts
npm run db:generate
```

Creates migration files in `drizzle/` directory.

### Apply Migrations

```bash
# Apply pending migrations
npm run db:migrate
```

### Push Schema (Development)

```bash
# Push schema directly without migrations (faster for dev)
npm run db:push
```

**Note**: `db:push` is great for development, but use proper migrations for production.

## Type Safety

Drizzle provides full TypeScript support:

```typescript
// Inferred types
type Chunk = typeof documentEmbeddings.$inferSelect;
type NewChunk = typeof documentEmbeddings.$inferInsert;

// Type-safe queries
const chunk: Chunk = await db
  .select()
  .from(documentEmbeddings)
  .where(eq(documentEmbeddings.id, "closures_index_chunk_0"))
  .limit(1)
  .then(rows => rows[0]);

// TypeScript knows all available fields!
console.log(chunk.text);
console.log(chunk.metadata);
console.log(chunk.embedding);
```

## Example: Complete RAG Query

```typescript
import { db } from "@/db";
import { documentEmbeddings } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function searchDocumentation(
  query: string,
  queryEmbedding: number[],
  options: {
    limit?: number;
    filterSource?: string;
    filterPageType?: string;
  } = {}
) {
  const { limit = 5, filterSource, filterPageType } = options;

  let conditions = [];
  
  if (filterSource) {
    conditions.push(sql`${documentEmbeddings.source} = ${filterSource}`);
  }
  
  if (filterPageType) {
    conditions.push(sql`${documentEmbeddings.pageType} = ${filterPageType}`);
  }

  const whereClause = conditions.length > 0 
    ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
    : sql``;

  const results = await db.execute(sql`
    SELECT 
      id,
      text,
      character_count,
      word_count,
      source,
      start_line,
      end_line,
      heading,
      title,
      slug,
      page_type,
      metadata,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM document_embeddings
    ${whereClause}
    ${conditions.length > 0 ? sql`AND` : sql`WHERE`}
    embedding IS NOT NULL
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${limit}
  `);

  return results.rows;
}
```

## Troubleshooting

### "relation does not exist"

Run migrations:
```bash
npm run db:push
```

### "extension vector does not exist"

Enable pgvector manually:
```bash
npm run db:connect
# Then in psql:
CREATE EXTENSION IF NOT EXISTS vector;
```

### Connection refused

Make sure database is running:
```bash
npm run db:status
npm run db:up
```

### Type errors with vector

The custom `pgvector` type handles conversion between:
- **TypeScript**: `number[]`
- **Database**: `vector(1536)`

Make sure to use JSON.stringify when passing to SQL:
```typescript
sql`${JSON.stringify(embedding)}::vector`
```

## Best Practices

### 1. Connection Pooling

```typescript
// Reuse the db instance (already pooled)
import { db } from "@/db";
```

### 2. Error Handling

```typescript
try {
  await db.insert(documentEmbeddings).values(data);
} catch (error) {
  console.error("Failed to insert:", error);
}
```

### 3. Batch Operations

```typescript
// Insert in batches of 100
const BATCH_SIZE = 100;

for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, i + BATCH_SIZE);
  await db.insert(documentEmbeddings).values(batch);
  console.log(`Inserted ${i + batch.length}/${chunks.length}`);
}
```

### 4. Transactions

```typescript
await db.transaction(async (tx) => {
  await tx.insert(documentEmbeddings).values(chunk1);
  await tx.insert(documentEmbeddings).values(chunk2);
  // Both succeed or both roll back
});
```

## Next Steps

1. **Start database**: `npm run db:up`
2. **Push schema**: `npm run db:push`
3. **Create embedding script**: Generate embeddings and insert to DB
4. **Test queries**: Verify vector similarity search works
5. **Integrate with chat**: Add retrieval logic to chat backend

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
