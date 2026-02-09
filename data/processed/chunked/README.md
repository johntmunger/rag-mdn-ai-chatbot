# Chunked MDN Documentation

This directory contains semantically chunked MDN JavaScript documentation, optimized for RAG (Retrieval-Augmented Generation) retrieval.

## Processing Summary

- **Source**: `mdn_docs/` - MDN JavaScript Guide
- **Files Processed**: 33 markdown files
- **Total Chunks**: 1,125 chunks
- **Average Chunks per File**: 34.1
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Processing Date**: 2026-02-09

## Chunk Structure

Each JSON file contains:

```json
{
  "source": "path/to/file.md",
  "totalChunks": 38,
  "chunkSize": 1000,
  "chunkOverlap": 200,
  "processedAt": "2026-02-09T18:00:00.000Z",
  "chunks": [...]
}
```

### Individual Chunk

Each chunk includes:

```json
{
  "id": "functions_index_chunk_0",
  "text": "Chunk content...",
  "characterCount": 823,
  "wordCount": 142,
  "metadata": {
    "source": "functions/index.md",
    "chunkIndex": 0,
    "startLine": 1,
    "endLine": 5,
    "heading": "Function declarations",
    "headingLevel": 3,
    "title": "Functions",
    "slug": "Web/JavaScript/Guide/Functions",
    "pageType": "guide",
    "sidebar": "jssidebar"
  }
}
```

## Chunk Structure

Each chunk contains:

**Root Level (Direct Properties):**
- **id**: Unique chunk identifier
- **text**: The actual chunk content
- **characterCount**: Number of characters in chunk text
- **wordCount**: Number of words in chunk text

**Metadata (Contextual Information):**
- **source**: Original file path
- **chunkIndex**: Position in document (0-indexed)
- **startLine/endLine**: Exact line numbers in source
- **heading**: Current section heading
- **headingLevel**: Heading depth (1-6)
- **title**: Document title from frontmatter
- **slug**: MDN URL slug
- **pageType**: Document type (guide, reference, etc.)
- **sidebar**: Sidebar identifier
- All other YAML frontmatter fields

## Files Generated

- Individual chunks: `{filename}_{path}.json`
- Processing log: `_processing_log.json`

## Usage

### Loading Chunks

```typescript
import fs from 'fs';

const chunksData = JSON.parse(
  fs.readFileSync('functions_index.json', 'utf-8')
);

// Access individual chunks
const chunks = chunksData.chunks;

// Filter by heading
const functionDeclarations = chunks.filter(
  chunk => chunk.metadata.heading === 'Function declarations'
);
```

### Accessing Chunk Properties

```typescript
const chunk = chunks[0];

// Direct properties
console.log(`ID: ${chunk.id}`);
console.log(`Characters: ${chunk.characterCount}`);
console.log(`Words: ${chunk.wordCount}`);
console.log(`Text: ${chunk.text.substring(0, 100)}...`);

// Contextual metadata
console.log(`Source: ${chunk.metadata.source}`);
console.log(`Lines: ${chunk.metadata.startLine}-${chunk.metadata.endLine}`);
console.log(`Heading: ${chunk.metadata.heading}`);
console.log(`URL: https://developer.mozilla.org${chunk.metadata.slug}`);
```

## Next Steps

1. **Generate Embeddings** (Stage 3)
   - Convert chunk text to vector embeddings
   - Use OpenAI `text-embedding-3-small` or similar
   - Store embeddings with metadata

2. **Vector Database** (Stage 4)
   - Upload to Pinecone, Weaviate, or similar
   - Index by embedding vectors
   - Enable semantic search

3. **Retrieval** (Stage 5)
   - Implement semantic search queries
   - Return top-k relevant chunks
   - Include metadata for citations

## Regeneration

To re-chunk with different settings:

```bash
# Larger chunks
npm run chunk -- --size 1500 --overlap 300

# Smaller chunks
npm run chunk -- --size 500 --overlap 100
```

This will overwrite existing chunks.

## Quality Assurance

✅ **Verified:**
- All 33 files processed successfully
- No errors in processing log
- Metadata complete for all chunks
- Line numbers accurate
- Heading context preserved
- Frontmatter extracted correctly

## Storage

- **Total Size**: ~2.8MB (JSON)
- **Format**: Human-readable JSON
- **Compression**: None (can be gzipped if needed)
- **Encoding**: UTF-8
