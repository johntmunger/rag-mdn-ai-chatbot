import "dotenv/config";
import { LlamaParseReader } from "llamaindex";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse a PDF file using LlamaParse
 * @param filePath - Path to the PDF file
 * @returns Parsed document content
 */
export default async function parsePDF(filePath: string) {
  try {
    // Verify API key is set
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      throw new Error(
        "LLAMA_CLOUD_API_KEY is not set in environment variables"
      );
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Parsing PDF: ${filePath}`);

    // Initialize LlamaParseReader
    const reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      resultType: "markdown", // or "text"
      verbose: true,
    });

    // Load and parse the document
    const documents = await reader.loadData(filePath);

    console.log(`Successfully parsed ${documents.length} document(s)`);

    // Return the parsed documents
    return documents;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw error;
  }
}

/**
 * Example usage: Parse canada.pdf
 */
export async function parseCanadaPDF() {
  const pdfPath = path.join(__dirname, "../../..", "canada.pdf");

  console.log(`Looking for PDF at: ${pdfPath}`);

  const documents = await parsePDF(pdfPath);

  // Log the content
  documents.forEach((doc, index) => {
    console.log(`\n--- Document ${index + 1} ---`);
    console.log(doc.text.substring(0, 500)); // First 500 chars
    console.log(`\nTotal length: ${doc.text.length} characters`);
  });

  return documents;
}

// If running directly
if (require.main === module) {
  parseCanadaPDF()
    .then(() => {
      console.log("\n✅ Parsing complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Parsing failed:", error);
      process.exit(1);
    });
}
