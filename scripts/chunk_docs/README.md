# MDN Documentation Chunking Scripts

Intelligent chunking scripts for processing MDN documentation into semantic chunks optimized for RAG (Retrieval-Augmented Generation).

## Overview

This directory contains scripts that recursively process markdown documentation, splitting it into semantically meaningful chunks while preserving document structure, metadata, and context.

## Features

### Document Structure-Based Chunking

- **Heading-Aware Splitting**: Prioritizes splitting on markdown headings (##, ###, etc.)
- **Hierarchical Context**: Maintains heading hierarchy and context
- **Smart Separators**: Falls back to paragraphs, sentences, words if needed
- **Overlap Management**: Configurable overlap to maintain context between chunks

### Rich Metadata

Each chunk includes comprehensive metadata:

```typescript
{
  source: string;           // Relative path to source file
  chunkIndex: number;       // Position in the document
  startLine: number;        // Starting line number (1-indexed)
  endLine: number;          // Ending line number
  heading: string;          // Current section heading
  headingLevel: number;     // Heading level (1-6)
  title: string;            // Document title from frontmatter
  slug: string;             // MDN slug
  pageType: string;         // Page type from frontmatter
  sidebar: string;          // Sidebar reference
  // ... all other frontmatter fields
}
```

### Batch Processing

- Processes files in configurable batches
- Progress reporting
- Error handling and logging
- Processing statistics

## Usage

### Basic Usage

```bash
# Chunk all MDN docs with default settings
npm run chunk

# Show help
npm run chunk:help
```

### Advanced Options

```bash
# Custom chunk size (1500 characters)
npm run chunk -- --size 1500

# Custom chunk size and overlap
npm run chunk -- --size 1500 --overlap 300

# Custom input/output directories
npm run chunk -- --input mdn_docs --output data/chunked

# Custom batch size (process 20 files at a time)
npm run chunk -- --batch 20
```

### Configuration Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--size` | `-s` | 1000 | Chunk size in characters |
| `--overlap` | `-o` | 200 | Overlap between chunks (characters) |
| `--batch` | `-b` | 10 | Number of files to process per batch |
| `--input` | `-i` | mdn_docs | Input directory path |
| `--output` | `-out` | data/processed/chunked | Output directory path |
| `--help` | `-h` | - | Show help message |

## Output Format

### Individual Chunk Files

Each source file generates a JSON file with this structure:

```json
{
  "source": "functions/index.md",
  "totalChunks": 12,
  "chunkSize": 1000,
  "chunkOverlap": 200,
  "processedAt": "2026-02-09T17:30:00.000Z",
  "chunks": [
    {
      "id": "functions_index_chunk_0",
      "text": "# Functions\n\nFunctions are one of...",
      "metadata": {
        "source": "functions/index.md",
        "chunkIndex": 0,
        "startLine": 8,
        "endLine": 45,
        "heading": "Functions",
        "headingLevel": 1,
        "title": "Functions",
        "slug": "Web/JavaScript/Guide/Functions",
        "pageType": "guide"
      }
    }
  ]
}
```

### Processing Log

A `_processing_log.json` file tracks the entire operation:

```json
{
  "totalFiles": 28,
  "totalChunks": 342,
  "errors": [],
  "processedFiles": ["index.md", "functions/index.md", ...],
  "config": {
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "batchSize": 10
  },
  "timestamp": "2026-02-09T17:30:00.000Z"
}
```

## Directory Structure

```
scripts/chunk_docs/
├── chunk-mdn.ts         # Main chunking script
└── README.md            # This file

Input:
mdn_docs/                # Source MDN markdown files
├── index.md
├── functions/
├── closures/
└── ...

Output:
data/processed/chunked/  # Chunked JSON files
├── index.json
├── functions_index.json
├── closures_index.json
├── _processing_log.json
└── ...
```

## Chunking Strategy

### 1. Frontmatter Extraction

First, the script extracts YAML frontmatter:

```yaml
---
title: Functions
slug: Web/JavaScript/Guide/Functions
page-type: guide
---
```

### 2. Hierarchical Splitting

The `RecursiveCharacterTextSplitter` uses these separators in order:

1. `\n## ` - H2 headings
2. `\n### ` - H3 headings
3. `\n#### ` - H4 headings
4. `\n##### ` - H5 headings
5. `\n\n` - Paragraphs
6. `\n` - Lines
7. `. ` - Sentences
8. ` ` - Words
9. `` - Characters (last resort)

### 3. Context Preservation

Each chunk maintains:
- **Heading context**: The current section heading
- **Line numbers**: Exact position in source file
- **Overlap**: Shared content with adjacent chunks
- **Metadata**: All frontmatter fields

### 4. Smart Line Tracking

The script tracks line numbers by:
1. Analyzing chunk content
2. Finding matching text in source
3. Calculating start/end positions
4. Maintaining cumulative position

## Examples

### Example 1: Simple Chunking

```bash
npm run chunk
```

Output:
```
🚀 Starting MDN Documentation Chunking

Configuration:
  Input: /path/to/mdn_docs
  Output: /path/to/data/processed/chunked
  Chunk Size: 1000 characters
  Chunk Overlap: 200 characters
  Batch Size: 10 files

📁 Scanning for markdown files...
   Found 28 files

📦 Processing batch 1/3
   ⚙️  index.md
      ✅ 8 chunks → index.json
   ⚙️  functions/index.md
      ✅ 12 chunks → functions_index.json
   ...

============================================================
📊 Chunking Complete!

✅ Files Processed: 28/28
📦 Total Chunks: 342
📏 Avg Chunks/File: 12.2

📝 Processing log saved to: data/processed/chunked/_processing_log.json
============================================================
```

### Example 2: Larger Chunks

For more context per chunk:

```bash
npm run chunk -- --size 1500 --overlap 300
```

This creates larger chunks (1500 chars) with more overlap (300 chars), useful for:
- Complex technical documentation
- Maintaining broader context
- Reducing total chunk count

### Example 3: Smaller Chunks

For more granular retrieval:

```bash
npm run chunk -- --size 500 --overlap 100
```

This creates smaller chunks, useful for:
- Precise information retrieval
- Question-answering systems
- Fine-grained context

## Integration with RAG Pipeline

### Current Stage: ✅ Chunking (Stage 2)

```
Parse → [Chunk] → Embed → Store → Retrieve
        ^^^^^^
      You are here
```

### Next Steps

After chunking, the pipeline continues:

1. **Embedding Generation** (Stage 3):
   ```bash
   npm run embed  # Coming soon
   ```
   Generate vector embeddings for each chunk.

2. **Vector Storage** (Stage 4):
   ```bash
   npm run ingest  # Coming soon
   ```
   Upload chunks with embeddings to vector database.

3. **Retrieval** (Stage 5):
   Implement semantic search in chat backend.

## Performance Considerations

### Memory Usage

- Batch processing prevents memory overflow
- Default batch size: 10 files
- Increase for more memory: `--batch 50`
- Decrease for less memory: `--batch 5`

### Processing Time

For 28 MDN guide files (~200KB total):
- **Chunking**: ~2-5 seconds
- **Larger corpus** (1000 files): ~3-5 minutes

### Chunk Size Guidelines

| Use Case | Chunk Size | Overlap | Notes |
|----------|-----------|---------|-------|
| **QA System** | 500-800 | 100-150 | Precise answers |
| **General RAG** | 1000-1500 | 200-300 | Balanced |
| **Summarization** | 2000-3000 | 300-500 | More context |

## Error Handling

The script includes comprehensive error handling:

- **File access errors**: Logged and skipped
- **Parsing errors**: Logged with file path
- **Invalid frontmatter**: Continues with empty metadata
- **Memory errors**: Batch processing prevents overflow

All errors are collected in the processing log.

## Troubleshooting

### No files found

```bash
❌ No markdown files found!
```

**Solution**: Check the input directory path:
```bash
ls mdn_docs/  # Should show markdown files
```

### Out of memory

```bash
JavaScript heap out of memory
```

**Solution**: Reduce batch size:
```bash
npm run chunk -- --batch 5
```

### Missing dependencies

```bash
Cannot find module 'langchain'
```

**Solution**: Install dependencies:
```bash
npm install
```

## Dependencies

- `langchain` - Text splitting with RecursiveCharacterTextSplitter
- `@langchain/core` - Core LangChain types
- `@langchain/community` - Community integrations
- `gray-matter` - YAML frontmatter parsing
- `tsx` - TypeScript execution

## Development

### Adding Custom Splitters

To add custom splitting logic:

```typescript
// In chunk-mdn.ts
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: config.chunkSize,
  chunkOverlap: config.chunkOverlap,
  separators: [
    // Add your custom separators here
    "\n## ",
    // ...
  ],
});
```

### Adding Metadata Fields

To track additional metadata:

```typescript
// In chunk-mdn.ts, chunkMarkdownFile function
const metadata: ChunkMetadata = {
  // ... existing fields
  customField: extractCustomField(chunkText),
};
```

## Best Practices

1. **Test with small corpus first**
   ```bash
   # Create test directory with a few files
   npm run chunk -- --input test_docs
   ```

2. **Review chunk quality**
   - Check a few output JSON files
   - Verify chunks make semantic sense
   - Adjust size/overlap if needed

3. **Monitor processing log**
   - Check for errors
   - Review chunk distribution
   - Adjust batch size for performance

4. **Document-specific tuning**
   - API docs: smaller chunks (500-800)
   - Guides: medium chunks (1000-1500)
   - Tutorials: larger chunks (1500-2000)

## References

- [LangChain Text Splitters](https://js.langchain.com/docs/modules/data_connection/document_transformers/)
- [RAG Best Practices](https://www.pinecone.io/learn/chunking-strategies/)
- [MDN Content Structure](https://github.com/mdn/content)
