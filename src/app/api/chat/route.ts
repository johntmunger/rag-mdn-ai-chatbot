import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentEmbeddings } from "@/db/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";
import { createVoyage } from "voyage-ai-provider";
import { embed } from "ai";

// Initialize OpenAI for chat completions
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Voyage for query embeddings (matches document embeddings)
const voyageApiKey =
  process.env.VOYAGEAI_API_KEY || process.env.VOYAGE_API_KEY;
const voyage = voyageApiKey ? createVoyage({ apiKey: voyageApiKey }) : null;
const voyageEmbeddingModel = voyage
  ? voyage.textEmbeddingModel("voyage-3.5-lite")
  : null;

/**
 * Generate embedding for a query (Voyage for RAG, mock fallback)
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (voyageEmbeddingModel) {
    const { embedding } = await embed({
      model: voyageEmbeddingModel,
      value: query,
      providerOptions: {
        voyage: { inputType: "query", outputDimension: 1024 },
      },
    });
    return embedding;
  }

  // Fallback: mock embedding when no Voyage API key
  console.warn("⚠️  No VOYAGEAI_API_KEY found, using mock embedding");
  return Array.from({ length: 1024 }, () => Math.random() * 2 - 1);
}

/**
 * Search for similar chunks using vector similarity
 */
async function searchSimilarChunks(
  queryEmbedding: number[],
  limit: number = 5
) {
  const results = await db.execute(sql`
    SELECT 
      id,
      text,
      source,
      heading,
      title,
      slug,
      start_line,
      end_line,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM document_embeddings
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${limit}
  `);

  // Return the rows array directly
  return Array.from(results as any);
}

/**
 * Generate AI response using retrieved chunks as context
 */
async function generateResponse(query: string, chunks: any[]): Promise<string> {
  if (!openai) {
    // Demo response when no API key
    return `**Demo Response (No OpenAI API Key)**\n\nBased on the MDN documentation chunks retrieved from the database, here's what I found:\n\n${chunks
      .map(
        (c, i) =>
          `**Source ${i + 1}:** ${c.title} - ${c.heading}\n${c.text.substring(0, 200)}...`
      )
      .join("\n\n")}\n\n*Note: Add OPENAI_API_KEY to .env for real AI responses.*`;
  }

  // Build context from chunks
  const context = chunks
    .map(
      (chunk, idx) =>
        `[Source ${idx + 1}: ${chunk.title} - ${chunk.heading}]\n${chunk.text}`
    )
    .join("\n\n---\n\n");

  // Call OpenAI with context
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are an expert JavaScript developer assistant. Answer questions using ONLY the provided MDN documentation context. Include citations like [1], [2] when referencing sources. Keep answers clear and concise.

Context from MDN Documentation:
${context}`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.choices[0].message.content || "No response generated.";
}

/**
 * POST /api/chat - Handle chat messages with RAG
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log(`📩 Received query: "${message}"`);

    // 1. Generate embedding for the query
    console.log("🔍 Generating query embedding...");
    const queryEmbedding = await generateQueryEmbedding(message);

    // 2. Search for similar chunks
    console.log("🔎 Searching for similar chunks...");
    const similarChunks = await searchSimilarChunks(queryEmbedding, 5);

    console.log(`   Found ${similarChunks.length} similar chunks`);
    similarChunks.forEach((chunk, idx) => {
      console.log(
        `   ${idx + 1}. ${chunk.title} - ${chunk.heading} (similarity: ${chunk.similarity.toFixed(3)})`
      );
    });

    // 3. Generate AI response
    console.log("🤖 Generating AI response...");
    const aiResponse = await generateResponse(message, similarChunks);

    // 4. Prepare citations for frontend (matches Citation type)
    const citations = similarChunks.map((chunk, idx) => ({
      id: (idx + 1).toString(),
      mdnTitle: chunk.title
        ? `${chunk.title} - ${chunk.heading}`
        : chunk.heading || "MDN Documentation",
      mdnUrl: chunk.slug
        ? `https://developer.mozilla.org/en-US/${chunk.slug}#line-${chunk.start_line}`
        : `https://developer.mozilla.org/en-US/docs/Web/JavaScript`,
      excerpt: chunk.text.substring(0, 200) + "...",
    }));

    console.log("✅ Response generated successfully\n");

    return NextResponse.json({
      response: aiResponse,
      citations,
      metadata: {
        queryEmbeddingGenerated: !!openai,
        chunksRetrieved: similarChunks.length,
        model: openai ? "gpt-4-turbo-preview" : "mock",
      },
    });
  } catch (error) {
    console.error("❌ Error in /api/chat:", error);
    
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
