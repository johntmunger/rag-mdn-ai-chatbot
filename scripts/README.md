# LlamaParse PDF Parser Scripts

Scripts for parsing PDF documents using LlamaParse (LlamaIndex cloud service).

## Setup

### 1. Environment Variables

Your API key should be in `.env` file in the `RAG MDN` directory:

```env
LLAMA_CLOUD_API_KEY=your_api_key_here
```

The `.env` file is already configured at: `/Users/m1promachine2022/code/AIDD/RAG MDN/.env`

### 2. Dependencies

Already installed:

- `llamaindex` - LlamaIndex library with LlamaParseReader
- `dotenv` - Environment variable management
- `tsx` - TypeScript execution
- `@types/node` - Node.js type definitions

## Usage

### Quick Start: Parse canada.pdf

Place your `canada.pdf` file in the `RAG MDN` directory (same level as `rag-mdn` folder), then run:

```bash
npm run parse
```

This will:

1. Load your PDF file
2. Parse it using LlamaParse
3. Save the output to `output/canada-parsed-1.md`
4. Display a preview in the console

### File Structure

```
RAG MDN/
├── .env                    # Your API key
├── canada.pdf             # Your PDF file to parse
└── rag-mdn/
    ├── scripts/
    │   ├── parse-canada.ts # Main parsing script
    │   └── README.md       # This file
    ├── src/lib/
    │   └── parser.ts       # Reusable parser module
    └── output/
        └── canada-parsed-*.md  # Output files
```

## Scripts

### parse-canada.ts

Main executable script for parsing canada.pdf. Features:

- Automatic file detection
- Error handling with helpful messages
- Progress logging
- Saves parsed content to markdown files
- Displays preview in console

**Run directly:**

```bash
npm run parse
```

**Or with tsx:**

```bash
npx tsx scripts/parse-canada.ts
```

### src/lib/parser.ts

Reusable parser module you can import in your application:

```typescript
import parsePDF, { parseCanadaPDF } from "@/lib/parser";

// Parse any PDF
const docs = await parsePDF("/path/to/file.pdf");

// Parse canada.pdf specifically
const canadaDocs = await parseCanadaPDF();
```

## LlamaParseReader Configuration

The reader is configured with:

```typescript
const reader = new LlamaParseReader({
  apiKey: process.env.LLAMA_CLOUD_API_KEY,
  resultType: "markdown", // or "text"
  verbose: true,
});
```

### Options

- `apiKey`: Your LlamaParse API key (from .env)
- `resultType`:
  - `"markdown"` - Returns formatted markdown (recommended)
  - `"text"` - Returns plain text
- `verbose`: `true` for detailed logging, `false` for quiet mode

### Advanced Options

```typescript
const reader = new LlamaParseReader({
  apiKey: process.env.LLAMA_CLOUD_API_KEY,
  resultType: "markdown",
  verbose: true,
  language: "en", // Language of the document
  parsingInstruction: "", // Custom parsing instructions
  skipDiagonalText: false, // Skip diagonal text
  invalidateCache: false, // Force re-parse
  doNotCache: false, // Don't cache results
});
```

## Output Format

Parsed documents are returned as an array:

```typescript
[
  {
    text: "Full parsed content...",
    metadata: {
      // Document metadata
    },
  },
];
```

## Troubleshooting

### API Key Not Found

```
❌ LLAMA_CLOUD_API_KEY not found in environment
```

**Solution**: Make sure `.env` file exists at `/Users/m1promachine2022/code/AIDD/RAG MDN/.env`

### File Not Found

```
❌ File not found: /path/to/canada.pdf
```

**Solution**: Place `canada.pdf` in the `RAG MDN` directory (not inside `rag-mdn`)

### Permission Denied

**Solution**: Check file permissions:

```bash
chmod 644 canada.pdf
```

### Module Not Found

**Solution**: Reinstall dependencies:

```bash
npm install
```

## Example: Custom Parser

Create your own parser script:

```typescript
import "dotenv/config";
import { LlamaParseReader } from "llamaindex";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function parseMyPDF() {
  const reader = new LlamaParseReader({
    apiKey: process.env.LLAMA_CLOUD_API_KEY!,
    resultType: "markdown",
  });

  const pdfPath = path.join(__dirname, "my-file.pdf");
  const documents = await reader.loadData(pdfPath);

  // Process documents
  for (const doc of documents) {
    console.log(doc.text);
  }

  return documents;
}

parseMyPDF();
```

## Integration with MDN Chat

To use parsed PDFs in the chat interface:

1. Parse your PDFs using the scripts
2. Store the parsed content in a vector database
3. Implement RAG retrieval in the chat backend
4. Return relevant chunks with citations

See `IMPLEMENTATION_GUIDE.md` for backend integration details.

## API Documentation

- [LlamaIndex Docs](https://docs.llamaindex.ai/)
- [LlamaParse API](https://docs.cloud.llamaindex.ai/)
- [Node.js LlamaIndex](https://ts.llamaindex.ai/)

## Notes

- LlamaParse is a cloud service that requires an API key
- Parsing may take a few seconds depending on PDF size
- Results are cached by default to save API calls
- Supports various document formats (PDF, DOCX, PPTX, etc.)
