# LlamaParse Setup Guide

Complete guide for parsing PDFs and preparing documentation for RAG ingestion.

## ✅ Setup Complete

1. ✅ Dependencies installed (`@llamaindex/cloud`, `llamaindex`, `dotenv`, `tsx`)
2. ✅ API key configured in `.env` file
3. ✅ Organized directory structure created (`data/pdfs/`, `data/processed/`)
4. ✅ Flexible parsing scripts implemented
5. ✅ NPM scripts configured for easy parsing

## Directory Structure

```
rag-mdn/
├── data/
│   ├── pdfs/                    # Input: PDF files to parse
│   │   └── canada.pdf          # Example Canadian document
│   ├── markdown/                # Input: Pre-existing markdown files
│   ├── html/                    # Input: HTML documentation
│   └── processed/               # Processing pipeline outputs
│       ├── raw/                 # Parsed markdown from PDFs
│       ├── chunked/             # Chunked content (coming soon)
│       └── embedded/            # Vector embeddings (coming soon)
├── scripts/
│   ├── parse-pdf.ts            # Main flexible PDF parser
│   ├── parse-canada.ts         # Legacy: Canada-specific parser
│   └── parse-mediacentre.ts    # Legacy: MediaCentre parser
└── src/lib/
    └── parser.ts               # Reusable parser module
```

## Quick Start

### Step 1: Add Your PDF Files

Place PDF files in the `data/pdfs/` directory:

```bash
# Add your PDFs
cp your-document.pdf rag-mdn/data/pdfs/

# Example: canada.pdf is already there
ls data/pdfs/
# canada.pdf
```

### Step 2: Run the Parser

**Parse all PDFs in the directory:**
```bash
npm run parse
# or
npm run parse:pdf
```

**Parse a specific PDF:**
```bash
npm run parse:pdf canada.pdf
```

**Get help:**
```bash
npm run parse:pdf -- --help
```

### Step 3: Check Output

Parsed content is saved to `data/processed/raw/`:

```bash
ls data/processed/raw/
# canada-1.md
# canada-2.md
# canada-1.metadata.json
# canada-2.metadata.json
```

## Code Examples

### Example 1: Quick Parse (scripts/parse-canada.ts)

```typescript
import "dotenv/config";
import { LlamaParseReader } from "llamaindex";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const reader = new LlamaParseReader({
    apiKey: process.env.LLAMA_CLOUD_API_KEY,
    resultType: "markdown",
    verbose: true,
  });

  const pdfPath = path.join(__dirname, "../../canada.pdf");
  const documents = await reader.loadData(pdfPath);

  console.log(documents[0].text);
}

main();
```

### Example 2: Reusable Function (src/lib/parser.ts)

```typescript
import parsePDF from "@/lib/parser";

// Use in your application
const documents = await parsePDF("/path/to/file.pdf");
```

## Environment Variables

Your `.env` file at `/Users/m1promachine2022/code/AIDD/RAG MDN/.env`:

```env
LLAMA_CLOUD_API_KEY=llx-qSVFOsyYddbKzzEl2VCpngcQ5XAFsnCfa8e7Za4JVtJ7djNy
```

## TypeScript Configuration

The parser uses:

- **ES Modules** with `import` syntax
- **Top-level await** for async operations
- **fileURLToPath** for `__dirname` in ESM
- **dotenv/config** for automatic environment loading

## What LlamaParse Does

1. Uploads your PDF to LlamaIndex cloud
2. Parses text, tables, images, and structure
3. Returns formatted markdown or plain text
4. Handles complex layouts and multi-column documents

## Result Type Options

### Markdown (Recommended)

```typescript
resultType: "markdown";
```

Returns structured markdown with headings, lists, tables

### Plain Text

```typescript
resultType: "text";
```

Returns unformatted text content

## Next Steps

### For MDN RAG Application

1. **Parse MDN documentation PDFs**
2. **Chunk the content** into smaller pieces
3. **Generate embeddings** for each chunk
4. **Store in vector database**
5. **Implement retrieval** in chat backend
6. **Add citations** to responses

See the main `README.md` and `IMPLEMENTATION_GUIDE.md` for integration details.

## Troubleshooting

### "Cannot find module 'llamaindex'"

```bash
npm install llamaindex
```

### "LLAMA_CLOUD_API_KEY is not set"

Check that:

1. `.env` file exists at `/Users/m1promachine2022/code/AIDD/RAG MDN/.env`
2. File contains `LLAMA_CLOUD_API_KEY=your_key`
3. No typos in the variable name

### "File not found"

Make sure `canada.pdf` is in the correct location:

```bash
ls "/Users/m1promachine2022/code/AIDD/RAG MDN/canada.pdf"
```

### TypeScript Import Errors

The parser uses ES modules. Make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

## Resources

- [LlamaIndex Docs](https://docs.llamaindex.ai/)
- [LlamaParse Docs](https://docs.cloud.llamaindex.ai/)
- [Get API Key](https://cloud.llamaindex.ai/)
