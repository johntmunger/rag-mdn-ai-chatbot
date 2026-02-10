#!/usr/bin/env node
/**
 * Generate embeddings for chunked MDN docs using Voyage AI + AISDK
 *
 * Reads from data/processed/chunked/*.json and writes to data/processed/embedded/*.json
 * with each chunk enriched with its embedding vector.
 */
import "dotenv/config";
import { createVoyage } from "voyage-ai-provider";
import { embedMany } from "ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support both VOYAGEAI_API_KEY and VOYAGE_API_KEY
const apiKey = (process.env.VOYAGEAI_API_KEY || process.env.VOYAGE_API_KEY)?.trim();

if (!apiKey) {
  console.error("❌ No Voyage API key found");
  console.error("Add VOYAGEAI_API_KEY or VOYAGE_API_KEY to your .env file");
  process.exit(1);
}

const voyage = createVoyage({ apiKey });

// voyage-code-3 (options passed via providerOptions in embedMany)
const embeddingModel = voyage.textEmbeddingModel("voyage-code-3");

interface ChunkData {
  id: string;
  text: string;
  characterCount: number;
  wordCount: number;
  metadata: Record<string, unknown>;
}

interface ChunkWithEmbedding extends ChunkData {
  embedding: number[];
}

interface ChunkFile {
  source: string;
  totalChunks: number;
  chunkSize: number;
  chunkOverlap: number;
  processedAt: string;
  chunks: ChunkData[];
}

const EMBED_BATCH_SIZE = 50;
const RATE_LIMIT_DELAY_MS = 100;

async function embedChunks(chunks: ChunkData[]): Promise<ChunkWithEmbedding[]> {
  const results: ChunkWithEmbedding[] = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: texts,
      providerOptions: {
        voyage: { inputType: "document", outputDimension: 1024 },
      },
    });

    for (let j = 0; j < batch.length; j++) {
      results.push({
        ...batch[j],
        embedding: embeddings[j],
      });
    }

    if (i + EMBED_BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }

  return results;
}

async function main() {
  const chunksDir = path.join(__dirname, "../data/processed/chunked");
  const outputDir = path.join(__dirname, "../data/processed/embedded");

  if (!fs.existsSync(chunksDir)) {
    console.error(`❌ Chunks directory not found: ${chunksDir}`);
    console.error("Run 'npm run chunk' first to generate chunks");
    process.exit(1);
  }

  const jsonFiles = fs
    .readdirSync(chunksDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  if (jsonFiles.length === 0) {
    console.error("❌ No chunk JSON files found");
    console.error("Run 'npm run chunk' first");
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("🚀 Generating embeddings with Voyage AI + AISDK\n");
  console.log(`   Model: voyage-code-3 (1536 dims)`);
  console.log(`   Input: ${chunksDir}`);
  console.log(`   Output: ${outputDir}\n`);

  let totalEmbedded = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(chunksDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ChunkFile;

    if (!content.chunks?.length) {
      console.log(`   ⏭️  Skipping ${file} (no chunks)`);
      continue;
    }

    console.log(`   ⚙️  ${file} (${content.chunks.length} chunks)`);

    try {
      const chunksWithEmbeddings = await embedChunks(content.chunks);

      const output = {
        ...content,
        chunks: chunksWithEmbeddings,
        embeddedAt: new Date().toISOString(),
        embeddingModel: "voyage-code-3",
        embeddingDimensions: 1024,
      };

      const outPath = path.join(outputDir, file);
      fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

      totalEmbedded += chunksWithEmbeddings.length;
      console.log(`      ✅ ${chunksWithEmbeddings.length} embeddings written\n`);
    } catch (err) {
      console.error(`      ❌ Error: ${err}`);
      throw err;
    }
  }

  console.log("=".repeat(50));
  console.log(`✅ Done! Embedded ${totalEmbedded} chunks from ${jsonFiles.length} files`);
  console.log("\nNext: npm run ingest -- --from-embedded");
  console.log("=".repeat(50));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
