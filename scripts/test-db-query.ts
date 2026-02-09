#!/usr/bin/env node
import "dotenv/config";
import { db, closeConnection } from "../src/db/index";
import {
  users,
  chatConversations,
  chatMessages,
  documentEmbeddings,
} from "../src/db/schema";
import { eq, desc, sql } from "drizzle-orm";

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
    // 2. Query Conversations
    // ============================================
    console.log("💬 Conversations:");
    const conversations = await db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.createdAt));

    if (conversations.length === 0) {
      console.log("   No conversations found.\n");
    } else {
      conversations.forEach((conv) => {
        console.log(`   • ${conv.title || "Untitled"}`);
      });
      console.log("");
    }

    // ============================================
    // 3. Query Messages
    // ============================================
    if (conversations.length > 0) {
      console.log("💬 Messages in first conversation:");
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversations[0].id))
        .orderBy(chatMessages.createdAt);

      messages.forEach((msg, idx) => {
        const preview = msg.content.substring(0, 60);
        console.log(`   ${idx + 1}. [${msg.role}] ${preview}...`);
        if (msg.sources && msg.sources.length > 0) {
          console.log(`      Sources: ${msg.sources.join(", ")}`);
        }
      });
      console.log("");
    }

    // ============================================
    // 4. Query Document Chunks
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
    // 5. Statistics
    // ============================================
    console.log("📊 Database Statistics:");
    
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [chunkCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentEmbeddings);
    
    const [messageCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages);

    console.log(`   • Total Users: ${userCount.count}`);
    console.log(`   • Total Conversations: ${conversations.length}`);
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
