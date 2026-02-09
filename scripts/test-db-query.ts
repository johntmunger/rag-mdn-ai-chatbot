#!/usr/bin/env node
import "dotenv/config";
import { db, closeConnection } from "../src/db/index";
import {
  users,
  documentEmbeddings,
} from "../src/db/schema";
import { sql } from "drizzle-orm";

/**
 * Test database queries and display results
 */
async function testQueries() {
  console.log("🔍 Testing Database Queries\n");

  try {
    // ============================================
    // 1. Query Users
    // ============================================
    console.log("👥 Users:");
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log("   No users found. Run 'npm run db:seed' first.\n");
    } else {
      allUsers.forEach((user) => {
        console.log(`   • ${user.name} (${user.email})`);
      });
      console.log("");
    }

    // ============================================
    // 2. Query Document Chunks
    // ============================================
    console.log("📄 Document Embeddings:");
    const chunks = await db
      .select({
        id: documentEmbeddings.id,
        source: documentEmbeddings.source,
        heading: documentEmbeddings.heading,
        characterCount: documentEmbeddings.characterCount,
        hasEmbedding: sql<boolean>`${documentEmbeddings.embedding} IS NOT NULL`,
      })
      .from(documentEmbeddings)
      .limit(10);

    if (chunks.length === 0) {
      console.log("   No document chunks found.\n");
    } else {
      console.log(`   Found ${chunks.length} chunks:\n`);
      chunks.forEach((chunk) => {
        console.log(`   • ${chunk.id}`);
        console.log(`     Source: ${chunk.source}`);
        console.log(`     Heading: ${chunk.heading}`);
        console.log(`     Chars: ${chunk.characterCount}`);
        console.log(`     Has Embedding: ${chunk.hasEmbedding ? "✅" : "❌"}`);
        console.log("");
      });
    }

    // ============================================
    // 3. Statistics
    // ============================================
    console.log("📊 Database Statistics:");
    
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [chunkCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentEmbeddings);

    console.log(`   • Total Users: ${userCount.count}`);
    console.log(`   • Total Document Chunks: ${chunkCount.count}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Database queries completed successfully!");
    console.log("\n🎨 View in Drizzle Studio:");
    console.log("   npm run db:studio");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error querying database:", error);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run queries
testQueries();
