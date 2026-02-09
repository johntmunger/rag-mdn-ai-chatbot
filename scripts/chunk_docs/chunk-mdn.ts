#!/usr/bin/env node
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChunkMetadata {
  source: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  heading: string;
  headingLevel: number;
  slug?: string;
  title?: string;
  pageType?: string;
  sidebar?: string;
  [key: string]: any;
}

interface Chunk {
  id: string;
  text: string;
  characterCount: number;
  wordCount: number;
  metadata: ChunkMetadata;
}

interface ProcessingStats {
  totalFiles: number;
  totalChunks: number;
  errors: string[];
  processedFiles: string[];
}

/**
 * Extract heading from a chunk of text
 */
function extractHeading(text: string): { heading: string; level: number } {
  const lines = text.trim().split("\n");
  
  for (const line of lines) {
    // Match markdown headings (# to ######)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      return {
        level: match[1].length,
        heading: match[2].trim()
      };
    }
  }
  
  return { heading: "", level: 0 };
}

/**
 * Find the current heading context for a given line number
 */
function findHeadingContext(
  lines: string[],
  startLine: number
): { heading: string; level: number } {
  // Look backwards from startLine to find the most recent heading
  for (let i = startLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line) continue; // Skip undefined/null lines
    
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      return {
        level: match[1].length,
        heading: match[2].trim()
      };
    }
  }
  
  return { heading: "", level: 0 };
}

/**
 * Calculate line numbers for a chunk in the original document
 */
function calculateLineNumbers(
  originalText: string,
  chunkText: string,
  previousEndLine: number
): { startLine: number; endLine: number } {
  const originalLines = originalText.split("\n");
  const chunkLines = chunkText.split("\n");
  
  // Get the first non-empty line of the chunk for precise matching
  const firstNonEmptyLine = chunkLines.find(line => line.trim().length > 0) || chunkText.substring(0, 50);
  
  // Find where this chunk starts in the original text
  let startLine = previousEndLine + 1;
  
  for (let i = previousEndLine; i < originalLines.length; i++) {
    // Match the first non-empty line precisely
    if (originalLines[i].trim() === firstNonEmptyLine.trim() || 
        originalLines[i].includes(firstNonEmptyLine.trim().substring(0, 50))) {
      startLine = i + 1; // 1-indexed
      break;
    }
  }
  
  const endLine = startLine + chunkLines.length - 1;
  
  return { startLine, endLine };
}

/**
 * Calculate the number of lines the frontmatter occupies in the original file
 */
function calculateFrontmatterOffset(originalContent: string, contentAfterFrontmatter: string): number {
  // If no frontmatter was extracted, offset is 0
  if (originalContent === contentAfterFrontmatter) {
    return 0;
  }
  
  // Find the closing frontmatter delimiter
  const lines = originalContent.split('\n');
  let closingDelimiterLine = -1;
  
  // Look for the second "---" (closing delimiter)
  let delimiterCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      delimiterCount++;
      if (delimiterCount === 2) {
        closingDelimiterLine = i;
        break;
      }
    }
  }
  
  // If we found the closing delimiter, calculate the offset
  // Content starts at closingDelimiterLine + 2 (1-indexed)
  // But we need the OFFSET to add to 1-indexed content lines
  // If content starts at line 8, and content line 1 should become file line 8,
  // then offset is 7 (since 1 + 7 = 8)
  if (closingDelimiterLine !== -1) {
    // closingDelimiterLine is 0-indexed, so closing line number is closingDelimiterLine + 1
    // Content starts one line after that, so contentStartsAtLine = closingDelimiterLine + 2
    // Offset = contentStartsAtLine - 1 (to convert content line 1 to file line)
    return closingDelimiterLine + 1;
  }
  
  return 0;
}

/**
 * Chunk a single markdown file with document structure awareness
 */
async function chunkMarkdownFile(
  filePath: string,
  relativePath: string,
  config: { chunkSize: number; chunkOverlap: number }
): Promise<Chunk[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  
  // Parse frontmatter
  const { data: frontmatter, content: rawMarkdownContent } = matter(content);
  
  // Trim leading blank lines from the content (gray-matter often includes them)
  const leadingBlankLines = (rawMarkdownContent.match(/^\n+/) || [''])[0].length;
  const markdownContent = rawMarkdownContent.replace(/^\n+/, '');
  
  // Calculate frontmatter offset for accurate line numbers
  // Add leadingBlankLines to account for the blank lines we trimmed
  const frontmatterOffset = calculateFrontmatterOffset(content, rawMarkdownContent) + leadingBlankLines;
  
  // Create splitter with markdown-aware separators
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: [
      "\n## ",    // H2 headings
      "\n### ",   // H3 headings
      "\n#### ",  // H4 headings
      "\n##### ", // H5 headings
      "\n\n",     // Paragraphs
      "\n",       // Lines
      ". ",       // Sentences
      " ",        // Words
      ""          // Characters
    ],
  });
  
  // Split the content
  const docs = await splitter.createDocuments([markdownContent]);
  
  const chunks: Chunk[] = [];
  const contentLines = markdownContent.split("\n");
  let previousEndLine = 0;
  
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const chunkText = doc.pageContent;
    
    // Calculate line numbers (relative to content without frontmatter)
    const { startLine: contentStartLine, endLine: contentEndLine } = calculateLineNumbers(
      markdownContent,
      chunkText,
      previousEndLine
    );
    
    // Adjust line numbers to account for frontmatter in original file
    const startLine = contentStartLine + frontmatterOffset;
    const endLine = contentEndLine + frontmatterOffset;
    
    // Find heading context (use content-relative line number)
    const headingContext = findHeadingContext(contentLines, contentStartLine - 1);
    
    // If no heading found by looking back, try extracting from chunk itself
    const chunkHeading = extractHeading(chunkText);
    const finalHeading = headingContext.heading || chunkHeading.heading || "Introduction";
    const finalLevel = headingContext.level || chunkHeading.level || 1;
    
    // Generate chunk ID
    const chunkId = `${relativePath
      .replace(/\//g, "_")
      .replace(/\.md$/, "")}_chunk_${i}`;
    
    // Calculate character and word counts
    const characterCount = chunkText.length;
    const wordCount = chunkText.trim().split(/\s+/).length;
    
    // Build metadata (contextual information)
    const metadata: ChunkMetadata = {
      source: relativePath,
      chunkIndex: i,
      startLine,
      endLine,
      heading: finalHeading,
      headingLevel: finalLevel,
      title: frontmatter.title,
      slug: frontmatter.slug,
      pageType: frontmatter["page-type"],
      sidebar: frontmatter.sidebar,
      ...frontmatter, // Include all frontmatter
    };
    
    // Create chunk with counts at root level
    chunks.push({
      id: chunkId,
      text: chunkText,
      characterCount,
      wordCount,
      metadata,
    });
    
    // Update previous end line (use content-relative for next iteration)
    previousEndLine = contentEndLine;
  }
  
  return chunks;
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Main chunking function
 */
async function chunkMdnDocs(options: {
  inputDir: string;
  outputDir: string;
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
}) {
  const {
    inputDir,
    outputDir,
    chunkSize = 1000,
    chunkOverlap = 200,
    batchSize = 10,
  } = options;
  
  console.log("🚀 Starting MDN Documentation Chunking\n");
  console.log("Configuration:");
  console.log(`  Input: ${inputDir}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Chunk Size: ${chunkSize} characters`);
  console.log(`  Chunk Overlap: ${chunkOverlap} characters`);
  console.log(`  Batch Size: ${batchSize} files\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Find all markdown files
  console.log("📁 Scanning for markdown files...");
  const markdownFiles = findMarkdownFiles(inputDir, inputDir);
  console.log(`   Found ${markdownFiles.length} files\n`);
  
  if (markdownFiles.length === 0) {
    console.log("❌ No markdown files found!");
    return;
  }
  
  const stats: ProcessingStats = {
    totalFiles: 0,
    totalChunks: 0,
    errors: [],
    processedFiles: [],
  };
  
  // Process files in batches
  for (let i = 0; i < markdownFiles.length; i += batchSize) {
    const batch = markdownFiles.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(markdownFiles.length / batchSize)}`);
    
    for (const filePath of batch) {
      const relativePath = path.relative(inputDir, filePath);
      
      try {
        console.log(`   ⚙️  ${relativePath}`);
        
        const chunks = await chunkMarkdownFile(filePath, relativePath, {
          chunkSize,
          chunkOverlap,
        });
        
        // Generate output filename
        const outputFileName = relativePath
          .replace(/\//g, "_")
          .replace(/\.md$/, ".json");
        const outputPath = path.join(outputDir, outputFileName);
        
        // Save chunks
        const output = {
          source: relativePath,
          totalChunks: chunks.length,
          chunkSize,
          chunkOverlap,
          processedAt: new Date().toISOString(),
          chunks,
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        
        stats.totalFiles++;
        stats.totalChunks += chunks.length;
        stats.processedFiles.push(relativePath);
        
        console.log(`      ✅ ${chunks.length} chunks → ${outputFileName}`);
      } catch (error) {
        const errorMsg = `Failed to process ${relativePath}: ${error}`;
        console.error(`      ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
    
    console.log("");
  }
  
  // Summary
  console.log("=" .repeat(60));
  console.log("📊 Chunking Complete!\n");
  console.log(`✅ Files Processed: ${stats.totalFiles}/${markdownFiles.length}`);
  console.log(`📦 Total Chunks: ${stats.totalChunks}`);
  console.log(`📏 Avg Chunks/File: ${(stats.totalChunks / stats.totalFiles).toFixed(1)}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`);
    stats.errors.forEach((err) => console.log(`   - ${err}`));
  }
  
  // Save processing log
  const logPath = path.join(outputDir, "_processing_log.json");
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      {
        ...stats,
        config: { chunkSize, chunkOverlap, batchSize },
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  
  console.log(`\n📝 Processing log saved to: ${logPath}`);
  console.log("=" .repeat(60));
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
MDN Documentation Chunker
=========================

Usage:
  npm run chunk                           Chunk all MDN docs with defaults
  npm run chunk -- --size 1500            Custom chunk size
  npm run chunk -- --size 1500 --overlap 300   Custom size and overlap

Options:
  --size, -s      Chunk size in characters (default: 1000)
  --overlap, -o   Chunk overlap in characters (default: 200)
  --batch, -b     Batch size for processing (default: 10)
  --input, -i     Input directory (default: mdn_docs)
  --output, -out  Output directory (default: data/processed/chunked)
  --help, -h      Show this help message

Examples:
  npm run chunk                                    # Default settings
  npm run chunk -- --size 1500 --overlap 300      # Custom chunking
  npm run chunk -- --input mdn_docs --output data/chunked
`);
    return;
  }
  
  // Parse arguments
  const getArg = (names: string[], defaultValue: any) => {
    for (const name of names) {
      const index = args.indexOf(name);
      if (index !== -1 && args[index + 1]) {
        return args[index + 1];
      }
    }
    return defaultValue;
  };
  
  const inputDir = path.join(__dirname, "../..", getArg(["--input", "-i"], "mdn_docs"));
  const outputDir = path.join(__dirname, "../..", getArg(["--output", "-out"], "data/processed/chunked"));
  const chunkSize = parseInt(getArg(["--size", "-s"], "1000"));
  const chunkOverlap = parseInt(getArg(["--overlap", "-o"], "200"));
  const batchSize = parseInt(getArg(["--batch", "-b"], "10"));
  
  await chunkMdnDocs({
    inputDir,
    outputDir,
    chunkSize,
    chunkOverlap,
    batchSize,
  });
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
