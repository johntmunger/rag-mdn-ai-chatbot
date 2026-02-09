#!/usr/bin/env node
import "dotenv/config";
import { db, closeConnection } from "../src/db/index";
import { sql } from "drizzle-orm";

/**
 * Push database schema directly without interactive prompt
 */
async function pushSchema() {
  console.log("🚀 Creating database schema...\n");

  try {
    // Create conversations table
    console.log("📋 Creating conversations table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    console.log("   ✅ conversations table created\n");

    // Create messages table
    console.log("📋 Creating messages table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources TEXT[],
        created_at TIMESTAMP DEFAULT now()
      )
    `);
    console.log("   ✅ messages table created\n");

    // Create indexes for conversations
    console.log("📋 Creating conversation indexes...");
    await db.execute(sql`CREATE INDEX IF NOT EXISTS conversation_created_at_idx ON conversations(created_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS message_conversation_id_idx ON messages(conversation_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS message_role_idx ON messages(role)`);
    console.log("   ✅ conversation indexes created\n");

    // Create document_embeddings table
    console.log("📋 Creating document_embeddings table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        character_count INTEGER NOT NULL,
        word_count INTEGER NOT NULL,
        embedding vector(1024),
        metadata JSONB NOT NULL,
        source TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        heading TEXT,
        heading_level INTEGER,
        title TEXT,
        slug TEXT,
        page_type TEXT,
        sidebar TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    console.log("   ✅ document_embeddings table created\n");

    // Create indexes for document_embeddings
    console.log("📋 Creating document_embeddings indexes...");
    await db.execute(sql`CREATE INDEX IF NOT EXISTS embedding_idx ON document_embeddings USING ivfflat (embedding vector_cosine_ops)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS source_idx ON document_embeddings(source)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS slug_idx ON document_embeddings(slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS page_type_idx ON document_embeddings(page_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS heading_idx ON document_embeddings(heading)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS metadata_idx ON document_embeddings USING gin(metadata)`);
    console.log("   ✅ document_embeddings indexes created\n");

    console.log("=" .repeat(60));
    console.log("✅ Schema created successfully!\n");
    console.log("Tables:");
    console.log("  • conversations");
    console.log("  • messages");
    console.log("  • document_embeddings\n");
    console.log("Next steps:");
    console.log("  npm run db:seed    # Populate with test data");
    console.log("  npm run db:test    # Verify data");
    console.log("  npm run db:studio  # Open visual browser");
    console.log("=" .repeat(60));
  } catch (error) {
    console.error("\n❌ Error creating schema:", error);
    throw error;
  } finally {
    await closeConnection();
  }
}

pushSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
