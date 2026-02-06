# RAG Document Processing Pipeline

Complete workflow for transforming documentation into a searchable knowledge base.

## Overview

```
📄 Input PDFs  →  🔍 Parse  →  ✂️ Chunk  →  🧮 Embed  →  💾 Store  →  🔎 Retrieve
```

## Pipeline Stages

### Stage 1: Parse Documents ✅ COMPLETE

**Purpose:** Convert various document formats into clean, structured markdown.

**Input:** `data/pdfs/*.pdf`, `data/html/*.html`  
**Output:** `data/processed/raw/*.md`

**Current Status:** ✅ Implemented with LlamaParse

**Scripts:**
```bash
# Parse all PDFs in data/pdfs/
npm run parse

# Parse specific file
npm run parse:pdf canada.pdf
```

**Features:**
- Handles complex PDF layouts
- Extracts tables, images, and formatting
- Preserves document structure
- Generates metadata for tracking

**Example Output:**
```markdown
# Fun Facts About Canada

We may be known as the Great White North...
```

---

### Stage 2: Chunk Content 🔨 IN PROGRESS

**Purpose:** Split documents into semantic chunks optimized for retrieval.

**Input:** `data/processed/raw/*.md`  
**Output:** `data/processed/chunked/*.chunks.json`

**Status:** 🔨 To be implemented

**Planned Scripts:**
```bash
# Chunk all parsed content
npm run chunk

# Chunk specific file
npm run chunk:file canada.md
```

**Chunking Strategy:**

1. **Semantic Chunking** - Split on natural boundaries (headings, paragraphs)
2. **Size Optimization** - Target ~500-1000 tokens per chunk
3. **Context Preservation** - Include overlapping context between chunks
4. **Metadata Enrichment** - Track source, page, section, etc.

**Example Output:**
```json
{
  "source": "canada.pdf",
  "chunks": [
    {
      "id": "canada-chunk-001",
      "text": "# Fun Facts About Canada\n\nWe may be known as...",
      "metadata": {
        "source": "canada.pdf",
        "page": 1,
        "section": "Introduction",
        "tokens": 256,
        "chunk_index": 0
      }
    },
    {
      "id": "canada-chunk-002",
      "text": "Wild about wildlife: Canada is home to...",
      "metadata": {
        "source": "canada.pdf",
        "page": 1,
        "section": "Wildlife",
        "tokens": 312,
        "chunk_index": 1
      }
    }
  ]
}
```

**Chunking Libraries to Consider:**
- `langchain` - Text splitters with overlap
- `@llamaindex/core` - Node parsers
- Custom implementation for MDN-specific structure

---

### Stage 3: Generate Embeddings 🔨 PLANNED

**Purpose:** Convert text chunks into vector embeddings for semantic search.

**Input:** `data/processed/chunked/*.chunks.json`  
**Output:** `data/processed/embedded/*.embeddings.json` or direct to vector DB

**Status:** 🔨 To be implemented

**Planned Scripts:**
```bash
# Generate embeddings for all chunks
npm run embed

# Generate for specific file
npm run embed:file canada.chunks.json
```

**Embedding Strategy:**

**Model Options:**
1. **OpenAI** - `text-embedding-3-small` (1536 dimensions)
2. **OpenAI** - `text-embedding-3-large` (3072 dimensions, higher quality)
3. **Cohere** - `embed-english-v3.0`
4. **Open Source** - `sentence-transformers` via Hugging Face

**Recommendation:** Start with `text-embedding-3-small` for cost/performance balance.

**Example Output:**
```json
{
  "source": "canada.pdf",
  "model": "text-embedding-3-small",
  "embeddings": [
    {
      "id": "canada-chunk-001",
      "text": "# Fun Facts About Canada...",
      "embedding": [0.123, -0.456, 0.789, ...], // 1536 dimensions
      "metadata": {
        "source": "canada.pdf",
        "page": 1,
        "section": "Introduction",
        "tokens": 256
      }
    }
  ]
}
```

**Rate Limiting:**
- OpenAI: ~3000 requests/min
- Batch processing with retry logic
- Progress tracking for large document sets

---

### Stage 4: Store in Vector Database 🔨 PLANNED

**Purpose:** Index embeddings for fast semantic search.

**Input:** Embeddings from Stage 3  
**Output:** Vector database with indexed chunks

**Status:** 🔨 To be implemented

**Vector Database Options:**

1. **Pinecone** ⭐ Recommended
   - Fully managed, serverless
   - Excellent performance
   - Free tier: 100k vectors
   - Easy setup

2. **Weaviate**
   - Open source option
   - Self-hosted or cloud
   - GraphQL API

3. **Qdrant**
   - Rust-based, fast
   - Good for local development
   - Open source

4. **Supabase + pgvector**
   - PostgreSQL extension
   - Good if already using Supabase

**Recommendation:** Start with Pinecone for simplicity.

**Schema Design:**
```typescript
interface VectorRecord {
  id: string;                    // "canada-chunk-001"
  values: number[];              // Embedding vector
  metadata: {
    source: string;              // "canada.pdf"
    text: string;                // Original chunk text
    page?: number;               // Page number
    section?: string;            // Section heading
    tokens: number;              // Token count
    url?: string;                // Link to source doc
    last_updated: string;        // ISO timestamp
  };
}
```

**Planned Scripts:**
```bash
# Upload to vector DB
npm run ingest

# Update specific namespace
npm run ingest:namespace mdn-javascript
```

---

### Stage 5: Implement Retrieval 🔨 PLANNED

**Purpose:** Query vector database and retrieve relevant chunks for RAG.

**Status:** 🔨 To be implemented

**Retrieval Flow:**

```
User Query → Embed Query → Vector Search → Rerank → Return Top K Chunks
```

**Implementation Steps:**

1. **Query Embedding**
   ```typescript
   const queryEmbedding = await embedText(userQuery);
   ```

2. **Vector Search**
   ```typescript
   const results = await vectorDB.query({
     vector: queryEmbedding,
     topK: 5,
     filter: { source: "mdn-javascript" }  // Optional filtering
   });
   ```

3. **Optional Reranking**
   - Use Cohere rerank API for better relevance
   - Combine with keyword search (hybrid search)

4. **Context Assembly**
   ```typescript
   const context = results.map(r => r.metadata.text).join("\n\n");
   ```

**Backend Integration:**
```typescript
// In your Next.js API route
export async function POST(req: Request) {
  const { query } = await req.json();
  
  // Get relevant chunks
  const chunks = await retrieveRelevantChunks(query);
  
  // Build context
  const context = chunks.map(c => c.text).join("\n\n");
  
  // Call LLM with context
  const response = await llm.chat({
    messages: [
      {
        role: "system",
        content: `Answer using this context:\n\n${context}`
      },
      {
        role: "user",
        content: query
      }
    ]
  });
  
  return Response.json({
    answer: response,
    sources: chunks.map(c => c.metadata)
  });
}
```

---

## Full Pipeline Script (Future)

**One command to process everything:**

```bash
npm run ingest:all
```

This will:
1. ✅ Parse all PDFs in `data/pdfs/`
2. ✂️ Chunk all parsed markdown
3. 🧮 Generate embeddings
4. 💾 Upload to vector database
5. ✅ Report completion with stats

---

## Current Progress Checklist

- [x] Set up LlamaParse
- [x] Create directory structure
- [x] Implement PDF parsing
- [x] Test with example document
- [ ] Implement chunking strategy
- [ ] Set up embedding generation
- [ ] Choose and configure vector database
- [ ] Implement retrieval logic
- [ ] Integrate with chat backend
- [ ] Add citation/source tracking
- [ ] Create full pipeline script
- [ ] Test with large MDN documentation set

---

## Next Immediate Steps

### 1. Implement Chunking (Next Task)

**To Do:**
- Choose chunking library (LangChain or custom)
- Define chunk size (target 500-1000 tokens)
- Implement overlap strategy
- Test with canada.pdf
- Create `scripts/chunk.ts`

### 2. Set Up Embeddings

**To Do:**
- Get OpenAI API key
- Test embedding generation
- Implement batch processing
- Add rate limiting
- Create `scripts/embed.ts`

### 3. Vector Database Setup

**To Do:**
- Sign up for Pinecone
- Create index
- Test upload
- Implement upsert logic
- Create `scripts/upload-vectors.ts`

---

## Performance Considerations

### For Large MDN Documentation

**Estimated Scale:**
- MDN docs: ~50,000 pages
- After chunking: ~200,000 chunks
- Storage: ~1.2GB embeddings (3-small model)

**Processing Time Estimates:**
- Parsing: 2-4 hours (depends on LlamaParse API)
- Chunking: 10-20 minutes
- Embedding: 1-2 hours (with rate limits)
- Vector upload: 20-30 minutes

**Cost Estimates (OpenAI):**
- Embedding: $200-300 for full corpus
- Ongoing: ~$5-10/month for updates

**Optimization:**
- Process in batches
- Cache embeddings
- Incremental updates only
- Use smaller model for testing

---

## Monitoring & Logging

Track progress during large ingestion:

```bash
# Run with logging
npm run ingest:all 2>&1 | tee data/ingestion-$(date +%Y%m%d).log
```

**Metrics to Track:**
- Files processed
- Chunks generated
- Embeddings created
- Upload success rate
- Total tokens consumed
- API costs

---

## Development vs Production

### Development
- Use small example files (canada.pdf)
- Local vector DB (Qdrant)
- Smaller embedding model
- Manual pipeline steps

### Production
- Full MDN documentation set
- Cloud vector DB (Pinecone)
- Production embedding model
- Automated pipeline
- Monitoring and alerts

---

## Questions to Resolve

- [ ] What subset of MDN docs to include?
- [ ] How to handle updates to MDN docs?
- [ ] Should we include code examples in embeddings?
- [ ] How to handle multilingual content?
- [ ] Citation format for UI display?

---

## Resources

- [LlamaIndex Docs](https://docs.llamaindex.ai/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Quickstart](https://docs.pinecone.io/docs/quickstart)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
