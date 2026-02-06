#!/usr/bin/env node
import "dotenv/config";
import { LlamaParseReader } from "llamaindex";
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

    // Path to canada.pdf (adjust as needed)
    const pdfPath = path.join(__dirname, "../../canada.pdf");

    console.log("🔍 Looking for PDF at:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ File not found: ${pdfPath}`);
      console.error(
        "\nPlease place your canada.pdf file in the RAG MDN directory"
      );
      process.exit(1);
    }

    console.log("📄 File found, starting parse...\n");

    // Initialize LlamaParseReader
    const reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      resultType: "markdown", // Options: "markdown" or "text"
      verbose: true,
    });

    // Parse the PDF
    const documents = await reader.loadData(pdfPath);

    console.log(`\n✅ Successfully parsed ${documents.length} document(s)\n`);

    // Display results
    documents.forEach((doc, index) => {
      console.log(`--- Document ${index + 1} ---`);
      console.log(`Length: ${doc.text.length} characters`);
      console.log(`Preview:\n${doc.text.substring(0, 500)}...\n`);

      // Optional: Save to file
      const outputPath = path.join(
        __dirname,
        `../output/canada-parsed-${index + 1}.md`
      );
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, doc.text);
      console.log(`💾 Saved to: ${outputPath}\n`);
    });

    console.log("🎉 Parsing complete!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
