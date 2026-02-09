# Quick Start Guide - Database Setup

After installing Docker Desktop, follow these steps to get your database running.

## Step-by-Step Setup

### 1. Reset Database (Clean Start)

```bash
npm run db:reset
```

This will:
- Stop any existing database
- Remove all data
- Start fresh with new configuration

### 2. Push Schema to Database

```bash
npm run db:push
```

**Important:** This will show a confirmation prompt listing all tables and indexes to create:
- users
- sessions  
- chat_conversations
- chat_messages
- document_embeddings

**Select:** `Yes, I want to execute all statements`

Use arrow keys to select, then press Enter.

### 3. Verify Tables Were Created

```bash
npm run db:connect
```

Inside psql, run:
```sql
\dt
```

You should see all 5 tables:
```
 Schema |        Name           | Type  | Owner
--------+-----------------------+-------+---------
 public | chat_conversations    | table | example
 public | chat_messages         | table | example
 public | document_embeddings   | table | example
 public | sessions              | table | example
 public | users                 | table | example
```

Type `\q` to exit psql.

### 4. Verify Extensions

```sql
\dx
```

Should show:
```
 Name      | Version | Schema | Description
-----------+---------+--------+-------------
 uuid-ossp | ...     | public | UUID generation
 vector    | ...     | public | vector data type
```

## Common Issues

### Error: "relation already exists"

**Solution:** Reset the database
```bash
npm run db:reset
npm run db:push
```

### Error: "permission denied while trying to connect to Docker daemon"

**Solution:** Start Docker Desktop manually
1. Open Docker Desktop from Applications
2. Wait for it to fully start (whale icon in menu bar)
3. Try again

### Drizzle push hangs or doesn't respond

**Solution:** Make sure to select "Yes" at the prompt
- Use arrow keys to navigate
- Press Enter to confirm

## What Gets Created

### Users Schema (4 tables)
- `users` - User accounts
- `sessions` - Active sessions
- `chat_conversations` - Chat history
- `chat_messages` - Individual messages

### Documents Schema (1 table)
- `document_embeddings` - Vector search for RAG
  - 1536-dimensional vectors
  - Chunk metadata
  - IVFFlat index for similarity search

## Next Steps

After tables are created:

1. **Generate embeddings** (coming soon):
   ```bash
   npm run embed
   ```

2. **Populate database** with 1,125 chunks

3. **Test semantic search**

4. **Integrate with chat backend**

## Verification Commands

```bash
# Check database is running
npm run db:status

# View logs
npm run db:logs

# Check tables
npm run db:connect
\dt

# Check indexes
npm run db:connect
\di
```

## Full Reset (If Needed)

To completely start over:

```bash
# Stop and remove everything
npm run db:down

# Remove Docker volume
docker volume rm rag-mdn_postgres_data

# Start fresh
npm run db:up
npm run db:push
```
