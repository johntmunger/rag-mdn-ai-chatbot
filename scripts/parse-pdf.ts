#!/usr/bin/env node
import "dotenv/config";
import { LlamaParseReader } from "@llamaindex/cloud";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ParseOptions {
  verbose?: boolean;
  resultType?: "markdown" | "text";
  saveMetadata?: boolean;
}

/**
 * Parse a single PDF file using LlamaParse
 */
async function parsePDF(
  pdfFileName: string,
  options: ParseOptions = {}
) {
  const { verbose = true, resultType = "markdown", saveMetadata = true } = options;

  try {
    // Check for API key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      console.error("❌ LLAMA_CLOUD_API_KEY not found in environment");
      console.error("Make sure you have a .env file with your API key");
      process.exit(1);
    }

    // Construct paths
    const pdfPath = path.join(__dirname, "../data/pdfs", pdfFileName);
    const outputDir = path.join(__dirname, "../data/processed/raw");

    console.log("🔍 Looking for PDF at:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ File not found: ${pdfPath}`);
      console.error("\nPlease place your PDF files in the data/pdfs/ directory");
      process.exit(1);
    }

    const stats = fs.statSync(pdfPath);
    console.log(`📄 File found! Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
    console.log("🚀 Starting LlamaParse...\n");

    // Initialize LlamaParseReader
    const reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      resultType,
      verbose,
      language: "en",
    });

    // Parse the PDF
    console.log("⏳ Uploading and parsing document (this may take a minute)...\n");
    const documents = await reader.loadData(pdfPath);

    console.log(`\n✅ Successfully parsed ${documents.length} document(s)\n`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate base filename from PDF name
    const baseName = path.basename(pdfFileName, ".pdf");

    // Save parsed documents
    documents.forEach((doc, index) => {
      const docNumber = documents.length > 1 ? `-${index + 1}` : "";
      
      console.log(`--- Document ${index + 1} ---`);
      console.log(`Length: ${doc.text.length} characters`);
      console.log(`Preview:\n${doc.text.substring(0, 300)}...\n`);

      // Save parsed content
      const outputPath = path.join(outputDir, `${baseName}${docNumber}.md`);
      fs.writeFileSync(outputPath, doc.text);
      console.log(`💾 Saved to: ${outputPath}\n`);

      // Save metadata if available and requested
      if (saveMetadata && doc.metadata) {
        const metadataPath = path.join(outputDir, `${baseName}${docNumber}.metadata.json`);
        fs.writeFileSync(
          metadataPath,
          JSON.stringify(doc.metadata, null, 2)
        );
        console.log(`📋 Metadata saved to: ${metadataPath}\n`);
      }
    });

    console.log("🎉 Parsing complete!");
    console.log("\n📁 Output saved to: data/processed/raw/");
    console.log("\nNext steps:");
    console.log("1. Review the parsed content for accuracy");
    console.log("2. Run chunking script (coming soon)");
    console.log("3. Generate embeddings (coming soon)");
    
    return documents;
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

/**
 * Parse all PDFs in the data/pdfs directory
 */
async function parseAllPDFs(options: ParseOptions = {}) {
  const pdfsDir = path.join(__dirname, "../data/pdfs");
  
  if (!fs.existsSync(pdfsDir)) {
    console.error(`❌ Directory not found: ${pdfsDir}`);
    console.error("Please create the data/pdfs/ directory and add PDF files");
    process.exit(1);
  }

  const pdfFiles = fs.readdirSync(pdfsDir).filter(file => file.endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.error("❌ No PDF files found in data/pdfs/");
    console.error("Please add PDF files to parse");
    process.exit(1);
  }

  console.log(`📚 Found ${pdfFiles.length} PDF file(s) to parse:\n`);
  pdfFiles.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));
  console.log("");

  for (const pdfFile of pdfFiles) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing: ${pdfFile}`);
    console.log("=".repeat(60) + "\n");
    
    await parsePDF(pdfFile, options);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ All PDFs processed successfully!");
  console.log("=".repeat(60));
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - parse all PDFs
    await parseAllPDFs();
  } else if (args[0] === "--help" || args[0] === "-h") {
    console.log(`
LlamaParse PDF Parser
=====================

Usage:
  npm run parse:pdf                    Parse all PDFs in data/pdfs/
  npm run parse:pdf <filename.pdf>     Parse a specific PDF file
  npm run parse:pdf --help             Show this help message

Examples:
  npm run parse:pdf                    # Parse all PDFs
  npm run parse:pdf canada.pdf         # Parse only canada.pdf
  
Directory Structure:
  data/pdfs/              Input PDF files
  data/processed/raw/     Parsed markdown output

Environment Variables:
  LLAMA_CLOUD_API_KEY     Your LlamaIndex Cloud API key (required)
`);
  } else {
    // Parse specific PDF
    const pdfFileName = args[0];
    await parsePDF(pdfFileName);
  }
}

main();
