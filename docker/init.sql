-- Initialize database with pgvector extension and all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS SCHEMA
-- ============================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    
    -- Authentication
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- OAuth fields
    provider TEXT,
    provider_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    
    -- Session metadata
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    
    -- Citations (array of chunk IDs)
    sources TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users schema
CREATE INDEX IF NOT EXISTS email_idx ON users(email);
CREATE INDEX IF NOT EXISTS provider_idx ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS token_idx ON sessions(token);
CREATE INDEX IF NOT EXISTS user_id_session_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS conversation_user_id_idx ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS message_conversation_id_idx ON chat_messages(conversation_id);

-- ============================================
-- DOCUMENTS SCHEMA (RAG)
-- ============================================

-- Create embeddings table for storing document chunks with vectors
CREATE TABLE IF NOT EXISTS document_embeddings (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    character_count INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    embedding vector(1536),  -- For OpenAI text-embedding-3-small
    
    -- Metadata (stored as JSONB for flexibility)
    metadata JSONB NOT NULL,
    
    -- Individual metadata fields for easier querying
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
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on embedding for fast similarity search
CREATE INDEX IF NOT EXISTS embedding_idx ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS source_idx ON document_embeddings(source);
CREATE INDEX IF NOT EXISTS slug_idx ON document_embeddings(slug);
CREATE INDEX IF NOT EXISTS page_type_idx ON document_embeddings(page_type);
CREATE INDEX IF NOT EXISTS heading_idx ON document_embeddings(heading);

-- Create GIN index on metadata for flexible JSON queries
CREATE INDEX IF NOT EXISTS metadata_idx ON document_embeddings USING gin(metadata);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_embeddings_updated_at 
    BEFORE UPDATE ON document_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper function for similarity search
CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding vector(1536),
    match_count integer DEFAULT 5,
    filter_source text DEFAULT NULL,
    filter_page_type text DEFAULT NULL
)
RETURNS TABLE (
    id text,
    text text,
    similarity float,
    source text,
    heading text,
    slug text,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        document_embeddings.id,
        document_embeddings.text,
        1 - (document_embeddings.embedding <=> query_embedding) as similarity,
        document_embeddings.source,
        document_embeddings.heading,
        document_embeddings.slug,
        document_embeddings.metadata
    FROM document_embeddings
    WHERE 
        (filter_source IS NULL OR document_embeddings.source = filter_source)
        AND (filter_page_type IS NULL OR document_embeddings.page_type = filter_page_type)
    ORDER BY document_embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create a view for quick stats
CREATE OR REPLACE VIEW embedding_stats AS
SELECT 
    COUNT(*) as total_chunks,
    COUNT(DISTINCT source) as total_documents,
    AVG(character_count) as avg_characters,
    AVG(word_count) as avg_words,
    MIN(created_at) as first_indexed,
    MAX(updated_at) as last_updated
FROM document_embeddings;

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO example;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO example;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialized successfully!';
    RAISE NOTICE '📊 Tables created: document_embeddings';
    RAISE NOTICE '🔍 Indexes created: embedding_idx, source_idx, slug_idx, etc.';
    RAISE NOTICE '⚡ Helper functions created: search_embeddings';
    RAISE NOTICE '📈 Views created: embedding_stats';
END $$;
