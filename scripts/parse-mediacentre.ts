#!/usr/bin/env node
import "dotenv/config";
import { LlamaParseReader } from "@llamaindex/cloud";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Check for API key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      console.error("❌ LLAMA_CLOUD_API_KEY not found in environment");
      console.error("Make sure you have a .env file with your API key");
      process.exit(1);
    }

    // Path to MediaCentre-FunFacts_EN_1.pdf
    const pdfPath = path.join(__dirname, "../MediaCentre-FunFacts_EN_1.pdf");

    console.log("🔍 Looking for PDF at:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ File not found: ${pdfPath}`);
      console.error(
        "\nPlease place your MediaCentre-FunFacts_EN_1.pdf file in the rag-mdn directory"
      );
      process.exit(1);
    }

    const stats = fs.statSync(pdfPath);
    console.log(`📄 File found! Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
    console.log("🚀 Starting LlamaParse...\n");

    // Initialize LlamaParseReader
    const reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      resultType: "markdown", // Options: "markdown" or "text"
      verbose: true,
      language: "en", // English document
    });

    // Parse the PDF
    console.log("⏳ Uploading and parsing document (this may take a minute)...\n");
    const documents = await reader.loadData(pdfPath);

    console.log(`\n✅ Successfully parsed ${documents.length} document(s)\n`);

    // Display results
    documents.forEach((doc, index) => {
      console.log(`--- Document ${index + 1} ---`);
      console.log(`Length: ${doc.text.length} characters`);
      console.log(`Preview:\n${doc.text.substring(0, 500)}...\n`);

      // Save to file
      const outputPath = path.join(
        __dirname,
        `../output/mediacentre-funfacts-parsed-${index + 1}.md`
      );
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, doc.text);
      console.log(`💾 Saved to: ${outputPath}\n`);

      // Also save metadata if available
      if (doc.metadata) {
        const metadataPath = path.join(
          __dirname,
          `../output/mediacentre-funfacts-metadata-${index + 1}.json`
        );
        fs.writeFileSync(
          metadataPath,
          JSON.stringify(doc.metadata, null, 2)
        );
        console.log(`📋 Metadata saved to: ${metadataPath}\n`);
      }
    });

    console.log("🎉 Parsing complete!");
    console.log("\nNext steps:");
    console.log("1. Check the output folder for parsed markdown");
    console.log("2. Review the content for accuracy");
    console.log("3. Use this content in your RAG system");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
