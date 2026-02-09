#!/usr/bin/env node
import "dotenv/config";
import { db, closeConnection } from "../src/db/index";
import { documentEmbeddings } from "../src/db/schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChunkData {
  id: string;
  text: string;
  characterCount: number;
  wordCount: number;
  metadata: {
    source: string;
    chunkIndex: number;
    startLine: number;
    endLine: number;
    heading: string;
    headingLevel: number;
    title?: string;
    slug?: string;
    pageType?: string;
    sidebar?: string;
    [key: string]: any;
  };
}

interface Stats {
  totalFiles: number;
  totalChunks: number;
  insertedChunks: number;
  errors: string[];
}

/**
 * Generate mock embedding vector
 */
function generateMockEmbedding(): number[] {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

/**
 * Process all chunked JSON files and insert into database
 */
async function ingestChunks(options: { useMockEmbeddings: boolean; batchSize: number }) {
  const { useMockEmbeddings, batchSize } = options;
  
  console.log("🚀 Starting Chunk Ingestion\n");
  console.log("Configuration:");
  console.log(`  Mode: ${useMockEmbeddings ? "Mock Embeddings" : "Real Embeddings (OpenAI)"}`);
  console.log(`  Batch Size: ${batchSize} chunks per batch\n`);

  const chunksDir = path.join(__dirname, "../data/processed/chunked");
  
  if (!fs.existsSync(chunksDir)) {
    console.error(`❌ Chunks directory not found: ${chunksDir}`);
    console.error("Run 'npm run chunk' first to generate chunks");
    process.exit(1);
  }

  const stats: Stats = {
    totalFiles: 0,
    totalChunks: 0,
    insertedChunks: 0,
    errors: [],
  };

  // Find all JSON files (excluding processing log)
  const jsonFiles = fs
    .readdirSync(chunksDir)
    .filter((file) => file.endsWith(".json") && !file.startsWith("_"));

  console.log(`📁 Found ${jsonFiles.length} chunk files\n`);

  if (jsonFiles.length === 0) {
    console.error("❌ No chunk files found!");
    console.error("Run 'npm run chunk' to generate chunks");
    process.exit(1);
  }

  // Collect all chunks from all files
  const allChunks: ChunkData[] = [];
  
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(chunksDir, file);
      const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      
      if (fileContent.chunks && Array.isArray(fileContent.chunks)) {
        allChunks.push(...fileContent.chunks);
        stats.totalFiles++;
      }
    } catch (error) {
      stats.errors.push(`Failed to read ${file}: ${error}`);
    }
  }

  stats.totalChunks = allChunks.length;
  console.log(`📦 Total chunks to process: ${stats.totalChunks}\n`);

  // Process in batches
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(allChunks.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);

    try {
      // Prepare batch for insertion
      const batchData = batch.map((chunk) => ({
        id: chunk.id,
        text: chunk.text,
        characterCount: chunk.characterCount,
        wordCount: chunk.wordCount,
        embedding: useMockEmbeddings ? generateMockEmbedding() : null,
        metadata: chunk.metadata,
        source: chunk.metadata.source,
        chunkIndex: chunk.metadata.chunkIndex,
        startLine: chunk.metadata.startLine,
        endLine: chunk.metadata.endLine,
        heading: chunk.metadata.heading || null,
        headingLevel: chunk.metadata.headingLevel || null,
        title: chunk.metadata.title || null,
        slug: chunk.metadata.slug || null,
        pageType: chunk.metadata.pageType || null,
        sidebar: chunk.metadata.sidebar || null,
      }));

      // Insert batch
      await db.insert(documentEmbeddings).values(batchData);
      
      stats.insertedChunks += batch.length;
      console.log(`   ✅ Inserted ${batch.length} chunks (${stats.insertedChunks}/${stats.totalChunks})\n`);
    } catch (error) {
      const errorMsg = `Batch ${batchNum} failed: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  // Summary
  console.log("=" .repeat(60));
  console.log("📊 Ingestion Complete!\n");
  console.log(`✅ Files Processed: ${stats.totalFiles}/${jsonFiles.length}`);
  console.log(`📦 Total Chunks: ${stats.totalChunks}`);
  console.log(`✅ Inserted: ${stats.insertedChunks}`);
  console.log(`❌ Failed: ${stats.totalChunks - stats.insertedChunks}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`);
    stats.errors.slice(0, 5).forEach((err) => console.log(`   - ${err}`));
    if (stats.errors.length > 5) {
      console.log(`   ... and ${stats.errors.length - 5} more`);
    }
  }

  console.log("\n🎨 View in Drizzle Studio:");
  console.log("   npm run db:studio");
  
  console.log("\n🔍 Test queries:");
  console.log("   npm run db:test");
  
  if (useMockEmbeddings) {
    console.log("\n💡 Note: Using mock embeddings for testing");
    console.log("   Run with --real flag to use OpenAI embeddings (requires API key)");
  }
  
  console.log("=" .repeat(60));
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Chunk Ingestion Script
======================

Ingests all chunked documents from data/processed/chunked/ into the database.

Usage:
  npm run ingest              # Use mock embeddings (fast, for testing)
  npm run ingest -- --real    # Use real OpenAI embeddings (requires API key)
  npm run ingest -- --batch 50  # Custom batch size

Options:
  --real, -r      Use real OpenAI embeddings (requires OPENAI_API_KEY in .env)
  --batch, -b     Batch size (default: 100)
  --help, -h      Show this help message

Examples:
  npm run ingest                    # Quick test with mock embeddings
  npm run ingest -- --real          # Production with real embeddings
  npm run ingest -- --batch 50      # Smaller batches
`);
    process.exit(0);
  }

  const useMockEmbeddings = !args.includes("--real") && !args.includes("-r");
  const batchSize = parseInt(
    args[args.indexOf("--batch") + 1] || args[args.indexOf("-b") + 1] || "100"
  );

  if (!useMockEmbeddings && !process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found in .env file");
    console.error("Add your OpenAI API key or use mock embeddings:");
    console.error("  npm run ingest (uses mock embeddings)");
    process.exit(1);
  }

  try {
    await ingestChunks({ useMockEmbeddings, batchSize });
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();
