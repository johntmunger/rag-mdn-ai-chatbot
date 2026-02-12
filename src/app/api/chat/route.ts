import { NextRequest } from "next/server";
import { db } from "@/db";
import { documentEmbeddings } from "@/db/schema";
import { sql } from "drizzle-orm";
import { createVoyage } from "voyage-ai-provider";
import { embed } from "ai";
import OpenAI from "openai";

// Initialize OpenAI for chat completions
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const hasOpenAI = !!openai;

// Initialize Voyage for query embeddings (matches document embeddings)
const voyageApiKey =
  process.env.VOYAGEAI_API_KEY || process.env.VOYAGE_API_KEY;
const voyage = voyageApiKey ? createVoyage({ apiKey: voyageApiKey }) : null;
const voyageEmbeddingModel = voyage
  ? voyage.textEmbeddingModel("voyage-code-3") // Updated to match our embeddings
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

  // Extract rows from Drizzle result
  return (results as any).rows || results;
}

/**
 * Build context string from search results
 */
function buildContext(chunks: any[]): string {
  return chunks
    .map((chunk, idx) => {
      const parts = [
        `--- Document ${idx + 1} ---`,
        `Title: ${chunk.title || "N/A"}`,
        `Source: ${chunk.source}`,
      ];

      if (chunk.heading) {
        parts.push(`Section: ${chunk.heading}`);
      }

      if (chunk.slug) {
        parts.push(`URL: https://developer.mozilla.org/en-US/docs/${chunk.slug}`);
      }

      parts.push(
        `Relevance: ${(chunk.similarity * 100).toFixed(1)}%`,
        `\nContent:\n${chunk.text}`,
        ""
      );

      return parts.join("\n");
    })
    .join("\n");
}

/**
 * System prompt for MDN documentation assistant
 */
function getSystemPrompt(): string {
  return `You are an expert JavaScript/Web Development assistant with deep knowledge of MDN (Mozilla Developer Network) documentation.

Your role is to:
- Answer questions accurately based on the provided MDN documentation context
- Explain concepts clearly with examples when helpful
- Reference the specific MDN pages when relevant (use [1], [2] notation for citations)
- Use proper technical terminology but explain it in an accessible way

CRITICAL CODE FORMATTING RULES:
- When showing code examples, WRITE FRESH, CLEAN CODE - do NOT copy code verbatim from the context
- Always use proper markdown code blocks: \`\`\`javascript followed by code, then \`\`\`
- Write syntactically correct JavaScript with proper variable names
- Use descriptive variable names like 'counter', 'name', 'result' (NOT placeholders or objects)
- Test that your code would actually run in JavaScript

Example of GOOD code formatting:
\`\`\`javascript
function example() {
  const name = "Alice";
  console.log(name);
}
\`\`\`

When answering:
- Explain concepts based on the context provided
- Write fresh, clean code examples to illustrate concepts
- Use [1], [2] citations to reference MDN sources
- Keep responses concise but thorough

If the context is insufficient, say so clearly.`;
}

/**
 * POST /api/chat - Handle chat messages with RAG (Streaming)
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📩 Received query: "${message}"`);

    // Check for OpenAI API key
    if (!hasOpenAI) {
      return new Response(
        JSON.stringify({ 
          error: "OPENAI_API_KEY not configured",
          details: "Add OPENAI_API_KEY to your .env file" 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

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

    // 3. Build context from chunks
    const context = buildContext(similarChunks);

    // 4. Prepare citations for frontend
    const citations = similarChunks.map((chunk, idx) => ({
      id: (idx + 1).toString(),
      mdnTitle: chunk.title
        ? `${chunk.title} - ${chunk.heading}`
        : chunk.heading || "MDN Documentation",
      mdnUrl: chunk.slug
        ? `https://developer.mozilla.org/en-US/docs/${chunk.slug}#line-${chunk.start_line}`
        : `https://developer.mozilla.org/en-US/docs/Web/JavaScript`,
      excerpt: chunk.text.substring(0, 200) + "...",
    }));

    // 5. Generate AI response using OpenAI (non-streaming - reliable and fast)
    console.log("🤖 Generating AI response with OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      max_tokens: 2048,
      stream: false,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: `Context from MDN Documentation:

${context}

---

Question: ${message}

Please answer based on the provided context.`,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || "No response generated.";
    
    console.log("✅ Response generated\n");

    return new Response(
      JSON.stringify({
        response: responseText,
        citations,
        metadata: {
          chunksRetrieved: similarChunks.length,
          model: "gpt-4-turbo-preview",
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error in /api/chat:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
