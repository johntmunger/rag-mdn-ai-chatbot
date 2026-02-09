#!/usr/bin/env node
import "dotenv/config";
import { db, closeConnection } from "../src/db/index";
import {
  users,
  sessions,
  chatConversations,
  chatMessages,
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
    // 2. Create Test Session
    // ============================================
    console.log("🔐 Creating test session...");
    
    const [testSession] = await db
      .insert(sessions)
      .values({
        userId: testUser.id,
        token: "test-session-token-12345",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Test Browser)",
      })
      .returning();

    console.log(`   ✅ Created session: ${testSession.token}\n`);

    // ============================================
    // 3. Create Test Conversation
    // ============================================
    console.log("💬 Creating test conversation...");
    
    const [conversation] = await db
      .insert(chatConversations)
      .values({
        userId: testUser.id,
        title: "JavaScript Closures Discussion",
      })
      .returning();

    console.log(`   ✅ Created conversation: ${conversation.title}\n`);

    // ============================================
    // 4. Load Sample Chunks from Closures
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
    // 5. Create Test Chat Messages
    // ============================================
    console.log("💬 Creating test chat messages...");
    
    const messages = await db
      .insert(chatMessages)
      .values([
        {
          conversationId: conversation.id,
          role: "user",
          content: "What are closures in JavaScript?",
        },
        {
          conversationId: conversation.id,
          role: "assistant",
          content:
            "A **closure** is the combination of a function bundled together with references to its surrounding state (the lexical environment). In JavaScript, closures are created every time a function is created, at function creation time.",
          sources: ["closures_index_chunk_0", "closures_index_chunk_1"],
        },
        {
          conversationId: conversation.id,
          role: "user",
          content: "Can you give me an example?",
        },
        {
          conversationId: conversation.id,
          role: "assistant",
          content:
            "Here's a simple example:\n\n```js\nfunction makeCounter() {\n  let count = 0;\n  return function() {\n    return count++;\n  };\n}\n\nconst counter = makeCounter();\nconsole.log(counter()); // 0\nconsole.log(counter()); // 1\n```\n\nThe inner function maintains access to `count` even after `makeCounter` has finished executing.",
          sources: ["closures_index_chunk_2"],
        },
      ])
      .returning();

    console.log(`   ✅ Created ${messages.length} chat messages\n`);

    // ============================================
    // 6. Display Summary
    // ============================================
    console.log("=" .repeat(60));
    console.log("🎉 Database Seeding Complete!\n");
    console.log("📊 Summary:");
    console.log(`   • Users: 1`);
    console.log(`   • Sessions: 1`);
    console.log(`   • Conversations: 1`);
    console.log(`   • Messages: ${messages.length}`);
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
