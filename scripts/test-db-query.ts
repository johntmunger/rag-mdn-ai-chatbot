#!/usr/bin/env node
import "dotenv/config";
import { db, closeConnection } from "../src/db/index";
import {
  conversations,
  messages,
  documentEmbeddings,
} from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Test database queries and display results
 */
async function testQueries() {
  console.log("🔍 Testing Database Queries\n");

  try {
    // ============================================
    // 1. Query Conversations
    // ============================================
    console.log("💬 Conversations:");
    const allConversations = await db
      .select()
      .from(conversations)
      .orderBy(conversations.createdAt);
    
    if (allConversations.length === 0) {
      console.log("   No conversations found. Run 'npm run db:seed' first.\n");
    } else {
      allConversations.forEach((conv) => {
        console.log(`   • ${conv.title || "Untitled"} (${conv.id})`);
      });
      console.log("");
    }

    // ============================================
    // 2. Query Messages
    // ============================================
    if (allConversations.length > 0) {
      console.log("💬 Messages in first conversation:");
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, allConversations[0].id))
        .orderBy(messages.createdAt);

      conversationMessages.forEach((msg, idx) => {
        const preview = msg.content.substring(0, 60);
        console.log(`   ${idx + 1}. [${msg.role}] ${preview}...`);
        if (msg.sources && msg.sources.length > 0) {
          console.log(`      Sources: ${msg.sources.join(", ")}`);
        }
      });
      console.log("");
    }

    // ============================================
    // 3. Query Document Chunks
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
    // 4. Statistics
    // ============================================
    console.log("📊 Database Statistics:");
    
    const [conversationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations);
    
    const [messageCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages);
    
    const [chunkCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentEmbeddings);

    console.log(`   • Total Conversations: ${conversationCount.count}`);
    console.log(`   • Total Messages: ${messageCount.count}`);
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
