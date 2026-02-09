-- Initialize database with required extensions only
-- Tables will be managed by Drizzle ORM migrations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Tables are created and managed by Drizzle ORM
-- Run 'npm run db:push' after starting the database to create all tables

-- All tables and indexes are now managed by Drizzle ORM
-- This file only handles extension setup
