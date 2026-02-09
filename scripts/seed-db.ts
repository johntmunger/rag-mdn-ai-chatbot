#!/usr/bin/env node
import "dotenv/config";
import { db, closeConnection } from "../src/db/index";
import {
  users,
  documentEmbeddings,
} from "../src/db/schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed the database with test data
 */
async function seedDatabase() {
  console.log("🌱 Seeding database with test data...\n");

  try {
    // ============================================
    // 1. Create Test Users
    // ============================================
    console.log("👤 Creating test users...");
    
    const [testUser] = await db
      .insert(users)
      .values({
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
      })
      .returning();

    console.log(`   ✅ Created user: ${testUser.email} (${testUser.id})\n`);

    // ============================================
    // 2. Load Sample Chunks from Closures
    // ============================================
    console.log("📄 Loading sample document chunks...");
    
    const chunksPath = path.join(
      __dirname,
      "../data/processed/chunked/closures_index.json"
    );
    
    if (!fs.existsSync(chunksPath)) {
      console.log("   ⚠️  Closures chunks not found, skipping document seeding");
      console.log("   Run 'npm run chunk' first to generate chunks\n");
    } else {
      const chunksData = JSON.parse(fs.readFileSync(chunksPath, "utf-8"));
      
      // Insert first 5 chunks as examples (with mock embeddings)
      const sampleChunks = chunksData.chunks.slice(0, 5);
      
      for (const chunk of sampleChunks) {
        // Generate a mock embedding (random 1536-dimensional vector)
        // In production, you'd use OpenAI API to generate real embeddings
        const mockEmbedding = Array.from({ length: 1536 }, () =>
          Math.random() * 2 - 1
        );

        await db.insert(documentEmbeddings).values({
          id: chunk.id,
          text: chunk.text,
          characterCount: chunk.characterCount,
          wordCount: chunk.wordCount,
          embedding: mockEmbedding,
          metadata: chunk.metadata,
          source: chunk.metadata.source,
          chunkIndex: chunk.metadata.chunkIndex,
          startLine: chunk.metadata.startLine,
          endLine: chunk.metadata.endLine,
          heading: chunk.metadata.heading,
          headingLevel: chunk.metadata.headingLevel,
          title: chunk.metadata.title,
          slug: chunk.metadata.slug,
          pageType: chunk.metadata.pageType,
          sidebar: chunk.metadata.sidebar,
        });

        console.log(`   ✅ Inserted chunk: ${chunk.id}`);
      }

      console.log(`   📊 Inserted ${sampleChunks.length} document chunks\n`);
    }

    // ============================================
    // 3. Display Summary
    // ============================================
    console.log("=" .repeat(60));
    console.log("🎉 Database Seeding Complete!\n");
    console.log("📊 Summary:");
    console.log(`   • Users: 1`);
    console.log(`   • Document Chunks: 5 (with mock embeddings)`);
    console.log("\n🔍 View in Drizzle Studio:");
    console.log("   npm run db:studio");
    console.log("\n📊 Or query from psql:");
    console.log("   npm run db:connect");
    console.log("=" .repeat(60));
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log("\n✅ Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
