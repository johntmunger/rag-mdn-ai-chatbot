#!/usr/bin/env node
/**
 * Search Script for RAG Application
 *
 * Performs vector similarity search using Voyage AI embeddings and PostgreSQL pgvector.
 * Uses cosine distance to find semantically similar document chunks.
 *
 * Usage: npm run search "your question here"
 */

import "dotenv/config";
import { createVoyage } from "voyage-ai-provider";
import { embedMany } from "ai";
import postgres from "postgres";

// Initialize database connection
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://example:example@localhost:5455/example";
const client = postgres(connectionString);

// Initialize Voyage AI provider
const apiKey = (
  process.env.VOYAGEAI_API_KEY || process.env.VOYAGE_API_KEY
)?.trim();
if (!apiKey) {
  console.error("❌ No Voyage API key found");
  process.exit(1);
}

const voyage = createVoyage({ apiKey });
const embeddingModel = voyage.textEmbeddingModel("voyage-code-3");

/**
 * Search result interface matching our document_embeddings schema
 */
export interface SearchResult {
  id: string;
  text: string;
  source: string;
  heading: string | null;
  title: string | null;
  slug: string | null;
  similarity: number; // Cosine similarity score (0-1, higher is better)
}

/**
 * Generate embedding for a question using Voyage AI
 */
async function generateQuestionEmbedding(question: string): Promise<number[]> {
  console.log(`🔮 Generating embedding for question...`);

  try {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: [question],
      providerOptions: {
        voyage: { inputType: "query", outputDimension: 1024 },
      },
    });

    console.log(
      `✅ Generated embedding with ${embeddings[0].length} dimensions\n`,
    );
    return embeddings[0];
  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    throw error;
  }
}

/**
 * Search for semantically similar chunks using vector cosine similarity
 *
 * Uses PostgreSQL pgvector's cosine distance operator (<=>)
 * Similarity = 1 - cosine_distance (higher score = more similar)
 */
async function searchSimilarChunks(
  questionEmbedding: number[],
  limit: number = 5,
  similarityThreshold: number = 0.0,
): Promise<SearchResult[]> {
  console.log(
    `🔍 Searching for ${limit} most similar chunks using vector cosine similarity...`,
  );

  try {
    // Use cosine similarity for vector search
    // 1 - cosine_distance gives us cosine similarity (higher = more similar)
    const results = await client`
      SELECT 
        id,
        text,
        source,
        heading,
        title,
        slug,
        (1 - (embedding <=> ${JSON.stringify(questionEmbedding)}::vector)) as similarity
      FROM document_embeddings
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${JSON.stringify(questionEmbedding)}::vector
      LIMIT ${limit}
    `;

    // Filter by similarity threshold
    const filteredResults = results.filter(
      (result) => result.similarity >= similarityThreshold,
    );

    console.log(
      `✅ Found ${filteredResults.length} results above threshold ${similarityThreshold}\n`,
    );

    return filteredResults as SearchResult[];
  } catch (error) {
    console.error("❌ Error searching similar chunks:", error);
    throw error;
  }
}

async function performSemanticSearch(
  question: string,
  limit: number = 5,
): Promise<SearchResult[]> {
  const similarityThreshold = 0.0;

  if (!question || question.trim().length === 0) {
    throw new Error("Search query cannot be empty");
  }

  if (!process.env.VOYAGEAI_API_KEY && !process.env.VOYAGE_API_KEY) {
    throw new Error("Voyage API key is not configured");
  }

  // Generate embedding for the question
  const questionEmbedding = await generateQuestionEmbedding(question);

  // Search for similar chunks
  const results = await searchSimilarChunks(
    questionEmbedding,
    limit,
    similarityThreshold,
  );

  return results;
}

// Export for potential use as a module
export {
  performSemanticSearch,
  generateQuestionEmbedding,
  searchSimilarChunks,
};
