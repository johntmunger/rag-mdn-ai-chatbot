import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// Simple users table for basic authentication
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    
    // Authentication
    passwordHash: text("password_hash"),
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

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
