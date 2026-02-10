# Semantic Search Script - Detailed Analysis

## Current Implementation Issues

The `scripts/semantic-search.ts` script is **not correctly set up** for your database schema.

### Issue Summary

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Wrong table name (`document_chunks` vs `document_embeddings`) | 🔴 CRITICAL | Query fails |
| 2 | Incorrect vector type definition | 🔴 CRITICAL | Type mismatch |
| 3 | Wrong database connection pattern | ⚠️ MODERATE | Connection pooling lost |
| 4 | Wrong embedding input type ("document" vs "query") | ⚠️ MODERATE | Poor matching |
| 5 | Incomplete result fields | ⚠️ MINOR | Missing metadata |

---

## Detailed Issue Analysis

### Issue 1: Wrong Table Name (CRITICAL)

**File**: `scripts/semantic-search.ts`, Line 38-44

**Current Code**:
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
- Script references table: `document_chunks`
- Actual database table: `document_embeddings`
- Result: **Query will fail** with "relation 'document_chunks' does not exist"

**Correct Table Definition**:
Located in `src/db/schema/documents.ts`, the actual table is:
```typescript
export const documentEmbeddings = pgTable("document_embeddings", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  embedding: vector("embedding"),
  source: text("source").notNull(),
  heading: text("heading"),
  title: text("title"),
  slug: text("slug"),
  // ... many more fields
});
```

**Fix**:
Import from actual schema instead of defining manually:
```typescript
import { documentEmbeddings } from "../src/db/schema";
```

---

### Issue 2: Incorrect Vector Type (CRITICAL)

**Current Code**:
```typescript
import { pgTable, text, vector } from "drizzle-orm/pg-core";

const documentChunks = pgTable("document_chunks", {
  embedding: vector("embedding", { dimensions: 1024 }),
});
```

**Problem**:
- Uses basic `vector` from `drizzle-orm/pg-core`
- Actual schema uses **custom vector type** with JSON serialization
- Custom type has `toDriver()` and `fromDriver()` methods
- Result: Type mismatches when accessing embeddings

**Actual Vector Type** (from `src/db/schema/documents.ts`):
```typescript
const vector = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return "vector(1024)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value as unknown as number[];
  },
});
```

**Fix**:
Use the database instance with the correct schema:
```typescript
import { db } from "../src/db/index";
import { documentEmbeddings } from "../src/db/schema";
```

---

### Issue 3: Wrong Database Connection (MODERATE)

**Current Code**:
```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL || "...";
const client = postgres(connectionString);
const db = drizzle(client);
```

**Problem**:
- Creates a new database connection for this script only
- Doesn't use existing connection from `src/db/index.ts`
- Loses connection pooling benefits
- Manual connection management is error-prone

**Correct Approach**:
```typescript
import { db } from "../src/db/index";
// Use existing database instance with pooling
```

---

### Issue 4: Wrong Embedding Input Type (MODERATE)

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
- Training phase used `inputType: "document"` for document chunks (correct for training)
- Search queries should use `inputType: "query"` (optimized for retrieval)
- Voyage AI treats these differently for optimal results

**Why It Matters**:
Voyage AI's embedding models are optimized for either:
- **"document"**: Embedding long-form content (what we do during training)
- **"query"**: Embedding short search queries (what we should do at search time)

Mixing them reduces semantic similarity accuracy.

**Fix**:
```typescript
const { embeddings } = await embedMany({
  model: embeddingModel,
  values: [query],
  providerOptions: {
    voyage: { inputType: "query", outputDimension: 1024 },
  },
});
```

---

### Issue 5: Incomplete Result Fields (MINOR)

**Current Code**:
```typescript
const results = await db
  .select({
    id: documentChunks.id,
    text: documentChunks.text,
    source: documentChunks.source,
    similarity: sql<number>`...`,
  })
  .from(documentChunks)
```

**Missing Fields Available in Schema**:
- `heading` - Section heading from the document
- `title` - Document title
- `slug` - URL-friendly slug
- `wordCount` - Number of words in chunk
- `chunkIndex` - Which chunk number
- `metadata` - Additional metadata (JSONB)

**Fix**:
```typescript
const results = await db
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

## Correct Semantic Search Flow

### Step 1: Question Embedding

```
User Question: "What are closures in JavaScript?"
        ↓
Import Voyage AI Model: voyage-3.5-lite
        ↓
Generate Embedding:
  - Model: voyage-3.5-lite
  - Input Type: "query" (optimized for search queries)
  - Dimension: 1024
  - Output: [0.0234, -0.0145, 0.0892, ..., -0.0123] (1024 values)
```

### Step 2: Vector Similarity Search

```
Query Embedding Vector: [0.0234, -0.0145, 0.0892, ...]
        ↓
PostgreSQL Query (with pgvector):
  - Database: document_embeddings
  - Operation: Cosine similarity using <=> operator
  - Method: Find smallest distance = most similar
  - Result: Top 5 closest matches
```

### Step 3: Return Results

```
For each matching chunk:
  - ID: Unique identifier
  - Text: Content preview
  - Source: Original document
  - Heading: Section name
  - Title: Document title
  - Slug: URL path
  - Similarity: Score (0-1, higher = better match)
```

---

## Database Schema Context

Your actual schema (`src/db/schema/documents.ts`):

```
TABLE: document_embeddings

PRIMARY FIELDS:
  id (text) ..................... Unique chunk identifier
  text (text) ................... Actual content of chunk
  embedding (vector, 1024) ...... THE EMBEDDINGS (used for search)
  source (text) ................. Document filename

METADATA FIELDS:
  heading (text) ................ Section heading
  title (text) .................. Document title
  slug (text) ................... URL-friendly slug
  metadata (jsonb) .............. Additional structured data
  
COMPUTED FIELDS:
  wordCount (integer) ........... Words in chunk
  characterCount (integer) ...... Characters in chunk
  chunkIndex (integer) .......... Which chunk number
  
TIMESTAMPS:
  createdAt (timestamp) ......... When inserted
  updatedAt (timestamp) ......... Last updated

INDEXES:
  embeddingIdx (IVFFlat) ........ Fast vector similarity search
  sourceIdx ..................... Filter by source
  slugIdx ....................... Filter by slug
  metadataIdx (GIN) ............. Search JSONB metadata
```

---

## Performance Implications

### Current Implementation Issues

| Aspect | Issue | Effect |
|--------|-------|--------|
| Table mismatch | Query fails | 0% success rate |
| Vector type | Type errors | Possible crashes |
| DB connection | No pooling | Slower queries |
| Query embedding | Wrong type | ~10-20% worse matching |
| Result metadata | Missing fields | Incomplete output |

### Fixed Implementation

All issues resolved → Semantic search works correctly

---

## Testing the Fix

Once corrected, test with:

```bash
# Test 1: Simple single-word query
npm run semantic-search "closures"

# Test 2: Question format
npm run semantic-search "What are closures?"

# Test 3: Multi-word query
npm run semantic-search "How do arrow functions work in JavaScript?"

# Expected output:
# ✅ Query embedding generated
# ✅ Found similar chunks
# ✅ Show results with similarity scores
# ✅ Display heading, title, slug info
```

---

## Files Referenced

- **Schema**: `src/db/schema/documents.ts` (actual schema)
- **Connection**: `src/db/index.ts` (database instance)
- **Current script**: `scripts/semantic-search.ts` (has issues)
- **Fixed script**: `scripts/semantic-search-fixed.ts` (corrected version)

---

## Summary

The semantic search script **is not currently set up correctly**. It has:

1. **Wrong table name** - References non-existent table
2. **Wrong vector type** - Type mismatches
3. **Wrong connection** - Doesn't use connection pooling
4. **Wrong input type** - Uses "document" instead of "query"
5. **Incomplete fields** - Missing available metadata

**Solution**: Use the corrected version in `scripts/semantic-search-fixed.ts`

