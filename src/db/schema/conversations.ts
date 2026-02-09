import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// Chat conversations - tracks user chat sessions
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title"), // Auto-generated or user-provided
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("conversation_created_at_idx").on(table.createdAt),
  })
);

// Chat messages - individual messages in conversations
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    
    // Citations/sources - references to document chunks
    sources: text("sources").array(), // Array of chunk IDs from document_embeddings
    
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    conversationIdIdx: index("message_conversation_id_idx").on(table.conversationId),
    roleIdx: index("message_role_idx").on(table.role),
  })
);

// Type inference
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
