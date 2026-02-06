# LlamaParse Setup Guide

Quick guide to get LlamaParse working with TypeScript.

## Already Completed ✅

1. ✅ Dependencies installed (`llamaindex`, `dotenv`, `tsx`)
2. ✅ API key configured in `.env` file
3. ✅ TypeScript parser files created
4. ✅ NPM script added

## Files Created

### 1. `scripts/parse-canada.ts`

Standalone executable script to parse canada.pdf

### 2. `src/lib/parser.ts`

Reusable parser module for your application

## How to Use

### Step 1: Place Your PDF

Put `canada.pdf` in the `RAG MDN` directory:

```
/Users/m1promachine2022/code/AIDD/
└── RAG MDN/
    ├── .env              ← Your API key is here
    ├── canada.pdf        ← Place your PDF here
    └── rag-mdn/
        └── scripts/
            └── parse-canada.ts
```

### Step 2: Run the Parser

```bash
npm run parse
```

### Step 3: Check Output

Parsed content will be saved to:

```
rag-mdn/output/canada-parsed-1.md
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
