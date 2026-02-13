import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

interface CrawlerConfig {
  projectDir: string;
  outputFile: string;
  maxDepth: number;
  maxFileSizeBytes: number;
  allowedExts: string[];
  ignoredFolders: string[];
  maxTokensThreshold: number; // Hard stop for safety
}

const CONFIG: CrawlerConfig = {
  projectDir: "./src", // Start in src to avoid root clutter
  outputFile: "./project-summary.md",
  maxDepth: 4,
  maxFileSizeBytes: 50 * 1024, // 50KB limit per file
  allowedExts: [".ts", ".tsx", ".json", ".md"],
  ignoredFolders: ["node_modules", ".git", "dist", "build", "coverage"],
  maxTokensThreshold: 100000, // If crawl > 100k tokens, don't even send to Haiku
};

function safeCrawl(dirPath: string, currentDepth: number = 0): string {
  let context = "";
  if (currentDepth > CONFIG.maxDepth) return "";

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!CONFIG.ignoredFolders.includes(file)) {
        context += safeCrawl(fullPath, currentDepth + 1);
      }
    } else {
      if (
        CONFIG.allowedExts.includes(path.extname(file)) &&
        stat.size < CONFIG.maxFileSizeBytes
      ) {
        const content = fs.readFileSync(fullPath, "utf8");
        context += `\n\n--- FILE: ${fullPath} ---\n${content}`;
      }
    }
  }
  return context;
}

async function generateSummary(): Promise<void> {
  const rawData = safeCrawl(CONFIG.projectDir);
  const estimatedTokens = Math.round(rawData.length / 4);

  console.log(`📏 Total Crawl: ~${estimatedTokens} tokens.`);

  // SAFETY CHECK: Prevent accidental high-dollar sends
  if (estimatedTokens > CONFIG.maxTokensThreshold) {
    throw new Error(
      `🚫 CRAWL TOO LARGE: ${estimatedTokens} tokens exceeds your safety limit!`,
    );
  }

  console.log(`🚀 Sending to Haiku 4.5 for compression...`);

  try {
    const result = await generateText({
      model: anthropic("claude-3-5-haiku-20241022"),
      messages: [
        {
          role: "user",
          content:
            `You are a Senior Technical Architect. I will provide a raw directory crawl of my project. Create a COMPREHENSIVE Technical Specification optimized for AI coding agents. Target 1,200-1,500 tokens minimum.

REQUIRED SECTIONS (ALL REQUIRED, BE THOROUGH):

1. **Project DNA** - Describe:
   - Complete tech stack with versions
   - All entry points (pages, APIs, scripts)
   - End-to-end data flow with specific details
   - Architecture patterns (RAG, caching, state management)

2. **Interface & Type Registry** - For EVERY TypeScript interface/type:
   - Full name and file path
   - 2-3 sentence description of purpose
   - Key properties and their types
   - Usage context in the application

3. **Export Catalog** - For EVERY exported function/component:
   - Full function signature with parameters
   - Complete return type
   - 2-3 sentence logic/behavior summary
   - Dependencies and side effects
   - File path

4. **Dependency Map** - Show:
   - Complete import hierarchy
   - Which files depend on which
   - External library usage and versions
   - Local module organization

5. **Style Guide** - Document:
   - All naming conventions with examples
   - Error handling patterns
   - Async/await patterns
   - Component composition patterns
   - Database query patterns

6. **Key Entry Points & Workflows** - For each:
   - Main files (pages, API routes, scripts)
   - Complete responsibility description
   - How it connects to other systems
   - Specific line numbers or key code sections

7. **Critical Implementation Details** - Include:
   - How the RAG system works (query → embedding → search → response)
   - How caching is implemented
   - How state is managed
   - Database schema structure
   - API response/request formats

8. **Configuration & Environment** - Document:
   - All required environment variables
   - Configuration structure
   - Safety limits and thresholds
   - Important constants and settings

FORMAT GUIDELINES:
- Use ## for main sections
- Use ### for subsections (file names, component names)
- Use bold for code references
- Include actual code examples where helpful
- Do NOT abbreviate or generalize
- Be specific, thorough, and detailed
- Target MINIMUM 1,200 tokens - aim for 1,500

PROJECT CRAWL:
\n\n` + rawData,
        },
      ],
    });

    const summary = result.text;

    // Report token usage
    console.log(`--- HAIKU EFFICIENCY REPORT ---`);
    console.log(
      `📥 Input (Raw Crawl): ${result.usage?.inputTokens || "N/A"} tokens`,
    );
    console.log(
      `📤 Output (Summary): ${result.usage?.outputTokens || "N/A"} tokens`,
    );
    if (result.usage?.inputTokens && result.usage?.outputTokens) {
      console.log(
        `✂️ Compression Ratio: ${Math.round((1 - result.usage.outputTokens / result.usage.inputTokens) * 100)}%`,
      );
    }

    fs.writeFileSync(CONFIG.outputFile, summary);
    console.log(`✅ SUCCESS! Review: ${CONFIG.outputFile}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ API Error:", error.message);
    } else {
      console.error("❌ API Error:", error);
    }
  }
}

generateSummary();
