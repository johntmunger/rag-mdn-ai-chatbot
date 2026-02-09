import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom vector type for pgvector (1536 dimensions for OpenAI text-embedding-3-small)
const vector = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value as unknown as number[];
  },
});

// Document embeddings table
export const documentEmbeddings = pgTable(
  "document_embeddings",
  {
    // Primary fields
    id: text("id").primaryKey(),
    text: text("text").notNull(),
    characterCount: integer("character_count").notNull(),
    wordCount: integer("word_count").notNull(),
    embedding: vector("embedding"),

    // Full metadata as JSONB
    metadata: jsonb("metadata").notNull(),

    // Individual metadata fields for easier querying
    source: text("source").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    startLine: integer("start_line").notNull(),
    endLine: integer("end_line").notNull(),
    heading: text("heading"),
    headingLevel: integer("heading_level"),
    title: text("title"),
    slug: text("slug"),
    pageType: text("page_type"),
    sidebar: text("sidebar"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Vector similarity index
    embeddingIdx: index("embedding_idx").using(
      "ivfflat",
      table.embedding.op("vector_cosine_ops")
    ),
    // Metadata indexes
    sourceIdx: index("source_idx").on(table.source),
    slugIdx: index("slug_idx").on(table.slug),
    pageTypeIdx: index("page_type_idx").on(table.pageType),
    headingIdx: index("heading_idx").on(table.heading),
    // GIN index for JSONB
    metadataIdx: index("metadata_idx").using("gin", table.metadata),
  })
);

// Type inference for TypeScript
export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type NewDocumentEmbedding = typeof documentEmbeddings.$inferInsert;
