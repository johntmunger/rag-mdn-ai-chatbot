# Docker Setup Guide

PostgreSQL with pgvector for vector similarity search in the RAG pipeline.

## Overview

This setup provides:
- **PostgreSQL 16** - Modern, powerful database
- **pgvector** - Extension for storing and querying vector embeddings
- **Persistent storage** - Data survives container restarts
- **Ready for RAG** - Pre-configured tables and indexes

## Quick Start

### 1. Start the Database

```bash
# Start PostgreSQL with pgvector
npm run db:up

# Check status
npm run db:status

# View logs
npm run db:logs
```

### 2. Verify Database is Running

```bash
# Check health
npm run db:status

# Should show:
# NAME               STATUS              PORTS
# rag-mdn-postgres   Up (healthy)        0.0.0.0:5455->5432/tcp
```

### 3. Connect to Database

```bash
# Using npm script (recommended)
npm run db:connect

# Or using psql directly (if installed locally)
psql postgresql://example:example@localhost:5455/example
```

### 4. Verify pgvector Extension

```sql
-- Inside psql
\dx

-- Should show:
-- vector | 0.7.x | public | vector data type and ivfflat access method
```

## Database Configuration

### Connection Details

- **Host**: `localhost`
- **Port**: `5455` (mapped from container's 5432)
- **Database**: `example`
- **Username**: `example`
- **Password**: `example`
- **Connection String**: `postgresql://example:example@localhost:5455/example`

> **Note**: Port 5455 is used to avoid conflicts with any local PostgreSQL instance running on the default 5432.

### Environment Variables

Already configured in `.env`:

```env
DATABASE_URL=postgresql://example:example@localhost:5455/example
POSTGRES_USER=example
POSTGRES_PASSWORD=example
POSTGRES_DB=example
POSTGRES_HOST=localhost
POSTGRES_PORT=5455
```

## Database Schema

### Table: `document_embeddings`

Stores chunked documents with vector embeddings:

```sql
CREATE TABLE document_embeddings (
    id TEXT PRIMARY KEY,              -- Chunk ID (e.g., "closures_index_chunk_0")
    text TEXT NOT NULL,               -- Chunk content
    character_count INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    embedding vector(1536),           -- Vector for similarity search
    
    -- Metadata (full JSON)
    metadata JSONB NOT NULL,
    
    -- Individual fields for easier querying
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
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

Optimized for fast similarity search and filtering:

```sql
-- Vector similarity search (ivfflat)
CREATE INDEX embedding_idx ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops);

-- Metadata filtering
CREATE INDEX source_idx ON document_embeddings(source);
CREATE INDEX slug_idx ON document_embeddings(slug);
CREATE INDEX page_type_idx ON document_embeddings(page_type);
CREATE INDEX heading_idx ON document_embeddings(heading);
CREATE INDEX metadata_idx ON document_embeddings USING gin(metadata);
```

### Helper Function: `search_embeddings`

Semantic search with optional filtering:

```sql
SELECT * FROM search_embeddings(
    query_embedding := '[0.1, 0.2, ...]'::vector(1536),
    match_count := 5,
    filter_source := 'functions/index.md',  -- Optional
    filter_page_type := 'guide'             -- Optional
);
```

Returns:
- `id`, `text`, `similarity`, `source`, `heading`, `slug`, `metadata`
- Ordered by similarity (highest first)

### View: `embedding_stats`

Quick statistics:

```sql
SELECT * FROM embedding_stats;

-- Returns:
-- total_chunks | total_documents | avg_characters | avg_words | first_indexed | last_updated
```

## NPM Scripts for Database Management

### Start/Stop

```bash
# Start database in background
npm run db:up

# Stop database
npm run db:down

# Reset database (deletes all data!)
npm run db:reset
```

### Monitoring

```bash
# Check status
npm run db:status

# View logs
npm run db:logs

# Connect to database
npm run db:connect
```

## Docker Commands (Alternative)

You can also use docker compose commands directly:

```bash
# Start in background
docker compose up -d

# Stop containers
docker compose down

# Stop and remove volumes (deletes all data!)
docker compose down -v
```

### Logs & Debugging

```bash
# View logs
docker compose logs -f db

# Check container status
docker compose ps

# Inspect container
docker compose exec db bash
```

### Database Operations

```bash
# Connect to database
docker compose exec db psql -U example -d example

# Run SQL file
docker compose exec -T db psql -U example -d example < your-script.sql

# Backup database
docker compose exec db pg_dump -U example example > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U example -d example
```

## Initialization

The database will automatically:
1. Create the `vector` extension
2. Create the `document_embeddings` table
3. Create all indexes for optimal performance
4. Set up helper functions and views

This happens via `docker/init.sql` on first startup.

## Connection from Node.js

### Install PostgreSQL Client

```bash
npm install pg @types/pg
```

### Example Connection

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // or individual params:
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5455'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

// Test connection
const client = await pool.connect();
console.log('✅ Connected to PostgreSQL');
client.release();
```

### Insert Embeddings

```typescript
async function insertEmbedding(chunk: Chunk, embedding: number[]) {
  await pool.query(
    `INSERT INTO document_embeddings 
     (id, text, character_count, word_count, embedding, metadata, 
      source, chunk_index, start_line, end_line, heading, heading_level, 
      title, slug, page_type, sidebar)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     ON CONFLICT (id) DO UPDATE SET
       embedding = EXCLUDED.embedding,
       updated_at = CURRENT_TIMESTAMP`,
    [
      chunk.id,
      chunk.text,
      chunk.characterCount,
      chunk.wordCount,
      JSON.stringify(embedding), // pgvector accepts JSON array
      chunk.metadata,
      chunk.metadata.source,
      chunk.metadata.chunkIndex,
      chunk.metadata.startLine,
      chunk.metadata.endLine,
      chunk.metadata.heading,
      chunk.metadata.headingLevel,
      chunk.metadata.title,
      chunk.metadata.slug,
      chunk.metadata.pageType,
      chunk.metadata.sidebar,
    ]
  );
}
```

### Query Similar Chunks

```typescript
async function findSimilarChunks(
  queryEmbedding: number[],
  limit: number = 5
) {
  const result = await pool.query(
    `SELECT 
       id, text, source, heading, slug,
       1 - (embedding <=> $1) as similarity
     FROM document_embeddings
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), limit]
  );
  
  return result.rows;
}
```

## Production Considerations

### Security

For production, update credentials:

```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Use env var
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_DB: ${POSTGRES_DB}
```

And create `.env.production`:

```env
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_USER=rag_user
POSTGRES_DB=rag_mdn_production
```

### Performance Tuning

For large datasets, adjust PostgreSQL settings:

```yaml
environment:
  # ... existing vars
  POSTGRES_INITDB_ARGS: "-E UTF8"
  POSTGRES_MAX_CONNECTIONS: 100
  POSTGRES_SHARED_BUFFERS: 256MB
```

### Backups

```bash
# Create backup
docker compose exec db pg_dump -U example example | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore backup
gunzip -c backup-20260209.sql.gz | docker compose exec -T db psql -U example -d example
```

## Troubleshooting

### Port Already in Use

If port 5455 is already in use:

```yaml
ports:
  - "5456:5432"  # Use different port
```

Update `.env`:
```env
POSTGRES_PORT=5456
DATABASE_URL=postgresql://example:example@localhost:5456/example
```

### Cannot Connect

```bash
# Check container is running
docker compose ps

# Check logs for errors
docker compose logs db

# Restart container
docker compose restart db
```

### Reset Database

```bash
# Stop and remove all data
docker compose down -v

# Start fresh
docker compose up -d
```

### Check pgvector Version

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## Monitoring

### Check Database Size

```sql
SELECT 
    pg_size_pretty(pg_database_size('example')) as db_size;
```

### Check Table Size

```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('document_embeddings')) as table_size;
```

### Check Embedding Stats

```sql
SELECT * FROM embedding_stats;
```

### Query Performance

```sql
-- Enable query timing
\timing on

-- Test similarity search
SELECT id, 1 - (embedding <=> '[0.1, 0.2, ...]') as similarity
FROM document_embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 10;
```

## Next Steps

1. **Install Docker Desktop** (if not already installed):
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Start Docker Desktop application

2. **Start Database**:
   ```bash
   npm run db:up
   ```

3. **Verify Setup**:
   ```bash
   # Check status
   npm run db:status
   
   # Connect and list tables
   npm run db:connect
   # Then in psql: \dt
   ```

4. **Install Node.js Client**:
   ```bash
   npm install pg @types/pg
   ```

5. **Create Embedding Script** (Next):
   - Generate embeddings for chunks
   - Insert into database
   - Test similarity search

## Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Docker Compose Reference](https://docs.docker.com/compose/)
