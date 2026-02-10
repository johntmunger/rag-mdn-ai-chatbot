# Semantic Search Script - Issues & Fixes

## Summary

The `scripts/semantic-search.ts` script has **critical issues** that will prevent it from working correctly. Here's what needs to be fixed.

---

## Issues Found

### 🔴 Issue 1: Wrong Table Name

**Current Code** (Line 38-44):
```typescript
const documentChunks = pgTable("document_chunks", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),
  source: text("source"),
  metadata: text("metadata"),
});
```

**Problem**: 
- Script queries table: `document_chunks`
- Actual table in database: `document_embeddings`
- Query will fail with "table not found" error

**Status**: ❌ **BROKEN**

---

### 🔴 Issue 2: Incorrect Vector Type Definition

**Current Code**:
```typescript
import { pgTable, text, vector } from "drizzle-orm/pg-core";

const documentChunks = pgTable("document_chunks", {
  embedding: vector("embedding", { dimensions: 1024 }),
});
```

**Problem**:
- Uses `vector` from `drizzle-orm/pg-core`
- Actual database schema uses custom vector type with JSON serialization
- Custom type has `toDriver()` and `fromDriver()` methods to handle serialization
- Direct vector may cause type mismatches

**Status**: ❌ **BROKEN**

---

### 🔴 Issue 3: Wrong Database Connection

**Current Code**:
```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL || "...";
const client = postgres(connectionString);
const db = drizzle(client);
```

**Problem**:
- Creates a new database connection instead of reusing existing one
- Doesn't leverage connection pooling from `src/db/index.ts`
- Manual connection management is error-prone

**Status**: ⚠️ **SUBOPTIMAL**

---

### 🔴 Issue 4: Wrong Input Type for Query Embedding

**Current Code**:
```typescript
const { embeddings } = await embedMany({
  model: embeddingModel,
  values: [query],
  providerOptions: {
    voyage: { inputType: "document", outputDimension: 1024 },
  },
});
```

**Problem**:
- Uses `inputType: "document"` for the search query
- Training embeddings used `inputType: "document"` for document chunks
- For semantic search, query should use `inputType: "query"`
- Voyage AI optimizes differently for "query" vs "document" types

**Result**: Suboptimal semantic matching

**Status**: ⚠️ **INCORRECT**

---

### 🔴 Issue 5: Incomplete Result Fields

**Current Code**:
```typescript
.select({
  id: documentChunks.id,
  text: documentChunks.text,
  source: documentChunks.source,
  similarity: sql<number>`...`,
})
```

**Missing Fields**:
- `heading` - The section heading from original doc
- `title` - Document title
- `slug` - Document slug
- `wordCount` - Chunk word count
- And others from actual schema

**Status**: ⚠️ **INCOMPLETE**

---

## Solution: Corrected Version

A corrected version is provided in `scripts/semantic-search-fixed.ts`

### Key Changes:

#### 1. ✅ Import from Actual Schema
```typescript
import { db } from "../src/db/index";
import { documentEmbeddings } from "../src/db/schema";
```

#### 2. ✅ Use Correct Table
```typescript
.from(documentEmbeddings)  // Correct table name
```

#### 3. ✅ Proper Vector Handling
```typescript
`'${JSON.stringify(queryEmbedding)}'::vector`
```

#### 4. ✅ Correct Input Type
```typescript
inputType: "query"  // Optimized for search queries
```

#### 5. ✅ Complete Metadata
```typescript
.select({
  id: documentEmbeddings.id,
  text: documentEmbeddings.text,
  source: documentEmbeddings.source,
  heading: documentEmbeddings.heading,
  title: documentEmbeddings.title,
  slug: documentEmbeddings.slug,
  similarity: sql<number>`...`,
})
```

---

## How Semantic Search Works (Corrected)

### Step 1: Question Embedding
```
Input: "What are closures in JavaScript?"
↓
Voyage AI API (voyage-3.5-lite)
- inputType: "query"
- outputDimension: 1024
↓
Output: [0.0234, -0.0145, 0.0892, ..., -0.0123]
(1024 dimensional vector)
```

### Step 2: Vector Similarity Search
```
Query Vector: [0.0234, -0.0145, ...]
↓
PostgreSQL (with pgvector)
- Cosine Distance: <=> operator
- Order by distance (smallest first)
- Limit to top 5 results
↓
Results:
1. Closures_chunk_0 (similarity: 0.87)
2. Closures_chunk_1 (similarity: 0.84)
3. Function_scope_chunk (similarity: 0.79)
...
```

### Step 3: Display Results
```
For each result:
- Show similarity score (0-100%)
- Show source document
- Show heading & title
- Show content preview
```

---

## Database Schema (Actual)

```
TABLE: document_embeddings (NOT document_chunks!)

Columns:
├─ id (text, PRIMARY KEY)
├─ text (text) — Chunk content
├─ embedding (vector, 1024 dims) — THE EMBEDDINGS
├─ source (text) — Source document
├─ heading (text) — Section heading
├─ title (text) — Document title
├─ slug (text) — Document slug
├─ metadata (jsonb) — Additional metadata
├─ createdAt (timestamp)
└─ updatedAt (timestamp)

Indexes:
├─ embeddingIdx (IVFFlat for vector search)
├─ sourceIdx
├─ slugIdx
└─ metadataIdx (GIN for JSONB)
```

---

## How to Fix

### Option 1: Replace the File (Recommended)
```bash
# Backup current version
cp scripts/semantic-search.ts scripts/semantic-search.ts.bak

# Use fixed version
cp scripts/semantic-search-fixed.ts scripts/semantic-search.ts
```

### Option 2: Manual Updates
Apply the changes from `semantic-search-fixed.ts` to the current file

---

## Testing the Fixed Version

Once fixed, test with:

```bash
# Simple query
npm run semantic-search "What are closures?"

# More complex query
npm run semantic-search "How do arrow functions differ from regular functions?"

# Multi-word query
npm run semantic-search "Explain the difference between var, let, and const in JavaScript"
```

Expected output:
```
═══════════════════════════════════════════════════════════════════════════════
📚 Semantic Search
═══════════════════════════════════════════════════════════════════════════════

Question: "What are closures?"

🔍 Generating embedding for query...

✅ Query embedding generated (1024 dimensions)

🔎 Searching database for similar chunks...

═══════════════════════════════════════════════════════════════════════════════
📖 Top 5 Semantic Matches
═══════════════════════════════════════════════════════════════════════════════

─────────────────────────────────────────────────────────────────────────────
#1 | Similarity: 87.23% | Source: closures_index.json
─────────────────────────────────────────────────────────────────────────────
Title: Understanding Closures
Heading: What are Closures?
Slug: what-are-closures

Content Preview:
A closure is the combination of a function bundled together with its lexical
environment. In other words, a closure gives you access to an outer function's
scope from an inner function...

[Similar results 2-5...]
```

---

## Verification Checklist

Before using semantic search:

- [ ] Database is running: `npm run db:status`
- [ ] Schema is pushed: `npm run db:push`
- [ ] Data is seeded: `npm run ingest`
- [ ] Script is updated with fixes
- [ ] Voyage API key is in `.env`
- [ ] Test query: `npm run semantic-search "test query"`

---

## Summary Table

| Issue | Current | Fixed | Impact |
|-------|---------|-------|--------|
| Table name | `document_chunks` | `document_embeddings` | ❌ Breaks |
| Vector type | Basic pgvector | Custom type | ⚠️ May fail |
| DB connection | New postgres() | Via db instance | ⚠️ Bad practice |
| Input type | "document" | "query" | ⚠️ Suboptimal |
| Result fields | 3 fields | 6+ fields | ⚠️ Incomplete |
| Error handling | Basic | Comprehensive | ⚠️ Unhelpful |

---

## Files

- **Original (broken)**: `scripts/semantic-search.ts`
- **Fixed version**: `scripts/semantic-search-fixed.ts`
- **Analysis**: `SEMANTIC_SEARCH_ANALYSIS.md` (detailed technical analysis)

---

**Recommendation**: Use the fixed version to ensure semantic search works correctly with your actual database schema and embedding model.

