import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";

/**
 * Custom pgvector column type.
 * toDriver converts number[] → "[x,y,z,...]" which is the format
 * postgres-js passes to Postgres for vector columns.
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1024)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
});

export const documentEmbeddings = pgTable("document_embeddings", {
  id: text("id").primaryKey(),

  text: text("text").notNull(),

  characterCount: integer("character_count").notNull(),
  wordCount: integer("word_count").notNull(),

  embedding: vector("embedding"),

  metadata: jsonb("metadata").notNull(),

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

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
