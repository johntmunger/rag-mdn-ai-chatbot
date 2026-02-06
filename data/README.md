# Data Directory Structure

This directory contains all input files, intermediate processing outputs, and final embeddings for the RAG system.

## Directory Structure

```
data/
├── pdfs/                   # 📄 Input: PDF files to be parsed
├── markdown/               # 📝 Input: Pre-existing markdown files
├── html/                   # 🌐 Input: HTML documentation files
└── processed/              # 🔄 Processing pipeline outputs
    ├── raw/                # Step 1: Raw parsed content (markdown)
    ├── chunked/            # Step 2: Chunked content (JSON)
    └── embedded/           # Step 3: Vector embeddings (JSON/DB)
```

## Processing Pipeline

### 1️⃣ Input Stage

**Place your source files here:**

- `data/pdfs/` - PDF documentation (e.g., MDN docs, API guides)
- `data/markdown/` - Already converted markdown files
- `data/html/` - HTML documentation that needs parsing

### 2️⃣ Parsing Stage → `processed/raw/`

**What happens:**
- PDFs are parsed using LlamaParse
- HTML is converted to markdown
- Markdown files are copied/validated

**Output format:**
- `.md` files with clean, structured markdown
- `.metadata.json` files with parsing metadata

**Scripts:**
```bash
npm run parse:pdf                 # Parse all PDFs
npm run parse:pdf canada.pdf      # Parse specific PDF
```

### 3️⃣ Chunking Stage → `processed/chunked/` *(Coming Soon)*

**What happens:**
- Markdown content is split into semantic chunks
- Chunks maintain context and structure
- Metadata preserved (source file, page, section)

**Output format:**
```json
{
  "chunks": [
    {
      "id": "canada-chunk-1",
      "text": "Chunk content here...",
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

**Scripts (Future):**
```bash
npm run chunk              # Chunk all parsed content
npm run chunk canada.md    # Chunk specific file
```

### 4️⃣ Embedding Stage → `processed/embedded/` *(Coming Soon)*

**What happens:**
- Each chunk gets vector embeddings
- Embeddings stored with metadata
- Ready for vector database ingestion

**Output format:**
```json
{
  "embeddings": [
    {
      "id": "canada-chunk-1",
      "text": "Chunk content...",
      "embedding": [0.123, -0.456, ...],
      "metadata": { ... }
    }
  ]
}
```

**Scripts (Future):**
```bash
npm run embed                    # Generate embeddings for all chunks
npm run ingest                   # Full pipeline: parse → chunk → embed
```

## File Naming Conventions

### Input Files
- Use descriptive names: `mdn-javascript-guide.pdf`
- Lowercase with hyphens: `api-reference-v2.pdf`
- No spaces in filenames

### Processed Files
- Parsed: `{source-name}.md`
- Chunked: `{source-name}.chunks.json`
- Embedded: `{source-name}.embeddings.json`
- Metadata: `{source-name}.metadata.json`

## Current Files

### PDFs
- `canada.pdf` - Canadian fun facts example document (for testing)

## Git Tracking

**.gitignore rules:**
```gitignore
# Track example/small files
data/pdfs/canada.pdf

# Ignore large production files
data/pdfs/mdn-*.pdf
data/markdown/*.md
data/html/*.html

# Always ignore processed outputs (can be regenerated)
data/processed/raw/*.md
data/processed/chunked/*.json
data/processed/embedded/*.json

# Keep directory structure
!data/processed/raw/.gitkeep
!data/processed/chunked/.gitkeep
!data/processed/embedded/.gitkeep
```

## Best Practices

### For Development
1. Use small example files (like `canada.pdf`) for testing
2. Commit example files to git for reproducibility
3. Test the full pipeline on small files first

### For Production
1. Keep large MDN docs in `data/pdfs/` but don't commit them
2. Document which docs are needed in this README
3. Provide download scripts if needed
4. Store embeddings in vector database, not files

### For Large Documentation Sets

When processing large MDN documentation:

1. **Organize by category:**
   ```
   data/pdfs/
   ├── mdn-javascript/
   ├── mdn-css/
   ├── mdn-html/
   └── mdn-web-apis/
   ```

2. **Process in batches:**
   - Parse similar documents together
   - Monitor API rate limits
   - Check output quality between batches

3. **Track progress:**
   - Keep a `processing-log.md` file
   - Note any parsing errors
   - Document quality issues

## Monitoring & Logs

Create a log file when processing large batches:

```bash
npm run parse:pdf 2>&1 | tee data/processing.log
```

## Cleaning Up

**Remove all processed outputs:**
```bash
rm -rf data/processed/raw/*.md
rm -rf data/processed/chunked/*.json
rm -rf data/processed/embedded/*.json
```

**Start fresh (keeps input files):**
```bash
npm run clean:processed    # Coming soon
```

## Next Steps

- [ ] Implement chunking script
- [ ] Add embedding generation
- [ ] Create full pipeline script
- [ ] Add vector database integration
- [ ] Create download script for MDN docs
- [ ] Add progress tracking for large batches
