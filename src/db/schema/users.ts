import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// Users table for authentication and tracking
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    
    // Authentication
    passwordHash: text("password_hash"), // For email/password auth
    emailVerified: boolean("email_verified").default(false),
    
    // OAuth fields (optional)
    provider: text("provider"), // 'google', 'github', etc.
    providerId: text("provider_id"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    lastLoginAt: timestamp("last_login_at"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    providerIdx: index("provider_idx").on(table.provider, table.providerId),
  })
);

// User sessions table
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    
    // Session metadata
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    tokenIdx: index("token_idx").on(table.token),
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

// User chat history
export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    
    title: text("title"), // Auto-generated or user-provided
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("conversation_user_id_idx").on(table.userId),
  })
);

// Individual chat messages
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    
    // Citations/sources used (for assistant messages)
    sources: text("sources").array(), // Array of chunk IDs
    
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    conversationIdIdx: index("message_conversation_id_idx").on(table.conversationId),
  })
);

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
