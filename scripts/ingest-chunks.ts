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
  embedding?: number[];
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
  };
}

interface Stats {
  totalFiles: number;
  totalChunks: number;
  insertedChunks: number;
  errors: string[];
}

function generateMockEmbedding(): number[] {
  return Array.from({ length: 1024 }, () => Math.random() * 2 - 1);
}

async function ingestChunks(options: {
  useMockEmbeddings: boolean;
  batchSize: number;
  fromEmbedded: boolean;
}) {
  const { useMockEmbeddings, batchSize, fromEmbedded } = options;

  const chunksDir = path.join(
    __dirname,
    "../data/processed",
    fromEmbedded ? "embedded" : "chunked",
  );

  console.log("🚀 Starting Chunk Ingestion\n");

  if (!fs.existsSync(chunksDir)) {
    console.error(`❌ Directory not found: ${chunksDir}`);
    process.exit(1);
  }

  const stats: Stats = {
    totalFiles: 0,
    totalChunks: 0,
    insertedChunks: 0,
    errors: [],
  };

  const jsonFiles = fs
    .readdirSync(chunksDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  console.log(`📁 Found ${jsonFiles.length} chunk files\n`);

  const allChunks: ChunkData[] = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(chunksDir, file);
      const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (fileContent.chunks) {
        allChunks.push(...fileContent.chunks);
        stats.totalFiles++;
      }
    } catch (err) {
      stats.errors.push(`Failed reading ${file}: ${err}`);
    }
  }

  stats.totalChunks = allChunks.length;
  console.log(`📦 Total chunks: ${stats.totalChunks}\n`);

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`📦 Batch ${batchNum}`);

    try {
      const batchData = batch.map((chunk) => {
        const embedding =
          fromEmbedded && chunk.embedding
            ? chunk.embedding
            : useMockEmbeddings
              ? generateMockEmbedding()
              : null;

        return {
          id: chunk.id,
          text: chunk.text,
          characterCount: chunk.characterCount,
          wordCount: chunk.wordCount,

          embedding: embedding ?? null,

          metadata: chunk.metadata,
          source: chunk.metadata.source,
          chunkIndex: chunk.metadata.chunkIndex,
          startLine: chunk.metadata.startLine,
          endLine: chunk.metadata.endLine,

          heading: chunk.metadata.heading ?? null,
          headingLevel: chunk.metadata.headingLevel ?? null,
          title: chunk.metadata.title ?? null,
          slug: chunk.metadata.slug ?? null,
          pageType: chunk.metadata.pageType ?? null,
          sidebar: chunk.metadata.sidebar ?? null,
        };
      });

      await db.insert(documentEmbeddings).values(batchData);

      stats.insertedChunks += batch.length;

      console.log(
        `   ✅ Inserted ${stats.insertedChunks}/${stats.totalChunks}`,
      );
    } catch (err) {
      console.error("❌ INSERT FAILED");
      console.error(err);
      stats.errors.push(String(err));
      throw err;
    }
  }

  console.log("\n==============================");
  console.log("📊 Ingestion Complete");
  console.log(`Files: ${stats.totalFiles}`);
  console.log(`Chunks: ${stats.totalChunks}`);
  console.log(`Inserted: ${stats.insertedChunks}`);
  console.log("==============================\n");
}

async function main() {
  const args = process.argv.slice(2);

  const fromEmbedded = args.includes("--from-embedded") || args.includes("-e");

  const useMockEmbeddings =
    !fromEmbedded && !args.includes("--real") && !args.includes("-r");

  const batchIdx = args.indexOf("--batch");
  const batchSize =
    batchIdx !== -1 ? parseInt(args[batchIdx + 1] || "100") : 100;

  try {
    await ingestChunks({
      useMockEmbeddings,
      batchSize,
      fromEmbedded,
    });
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await closeConnection();
  }
}

main();
