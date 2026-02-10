#!/usr/bin/env node
/**
 * Test suite to verify the database seeding setup
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  name: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function addResult(
  name: string,
  status: "✅" | "❌" | "⚠️",
  message: string,
  details?: string
) {
  results.push({ name, status, message, details });
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

function logResult(result: TestResult) {
  console.log(`\n${result.status} ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

// TEST 1: Environment Variables
logSection("TEST 1: Environment Variables");

const voyageKey = (
  process.env.VOYAGEAI_API_KEY || process.env.VOYAGE_API_KEY || ""
).trim();
const databaseUrl = process.env.DATABASE_URL || "";

if (voyageKey) {
  const maskedKey = voyageKey.substring(0, 10) + "***";
  addResult(
    "Voyage AI API Key",
    "✅",
    "Found Voyage API key",
    `Key: ${maskedKey}`
  );
} else {
  addResult(
    "Voyage AI API Key",
    "❌",
    "Missing Voyage API key - Add VOYAGEAI_API_KEY or VOYAGE_API_KEY to .env"
  );
}

if (databaseUrl) {
  const host = new URL(databaseUrl).hostname;
  addResult(
    "Database URL",
    "✅",
    "Found DATABASE_URL",
    `Host: ${host}`
  );
} else {
  addResult(
    "Database URL",
    "❌",
    "Missing DATABASE_URL in .env"
  );
}

results.forEach((r) => {
  if (r.name.includes("API") || r.name.includes("Database URL")) logResult(r);
});

// TEST 2: Dependencies
logSection("TEST 2: Package Dependencies");

const requiredDeps = [
  "voyage-ai-provider",
  "ai",
  "drizzle-orm",
  "drizzle-kit",
  "postgres",
];

try {
  const pkgPath = path.join(__dirname, "../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const dep of requiredDeps) {
    if (allDeps[dep]) {
      addResult(
        dep,
        "✅",
        `Installed`,
        `Version: ${allDeps[dep]}`
      );
    } else {
      addResult(dep, "❌", `Not found in package.json`);
    }
  }
} catch (err) {
  addResult(
    "Dependencies Check",
    "❌",
    "Failed to read package.json"
  );
}

results
  .filter((r) => requiredDeps.some(d => r.name.includes(d)))
  .forEach((r) => logResult(r));

// TEST 3: File Structure
logSection("TEST 3: Project File Structure");

const fileChecks = [
  {
    path: path.join(__dirname, "../scripts/generate-embeddings.ts"),
    name: "Embedding Script",
  },
  {
    path: path.join(__dirname, "../scripts/ingest-chunks.ts"),
    name: "Ingest Script",
  },
  {
    path: path.join(__dirname, "../src/db/schema/index.ts"),
    name: "Database Schema",
  },
  {
    path: path.join(__dirname, "../src/db/index.ts"),
    name: "Database Connection",
  },
  {
    path: path.join(__dirname, "../drizzle.config.ts"),
    name: "Drizzle Config",
  },
];

for (const check of fileChecks) {
  if (fs.existsSync(check.path)) {
    addResult(check.name, "✅", `Found`);
  } else {
    addResult(check.name, "❌", `Not found at ${check.path}`);
  }
}

results
  .slice(-fileChecks.length)
  .forEach((r) => logResult(r));

// TEST 4: Sample Data
logSection("TEST 4: Sample Data Availability");

const chunksDir = path.join(__dirname, "../data/processed/chunked");
const embeddedDir = path.join(__dirname, "../data/processed/embedded");

let chunkCount = 0;
let embeddedCount = 0;

if (fs.existsSync(chunksDir)) {
  const files = fs
    .readdirSync(chunksDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  chunkCount = files.length;
  if (chunkCount > 0) {
    addResult(
      "Chunked Data",
      "✅",
      `Found ${chunkCount} chunk files`,
      `Ready for embedding generation`
    );
  } else {
    addResult(
      "Chunked Data",
      "⚠️",
      "No chunk files found",
      "Run 'npm run chunk' to generate chunks"
    );
  }
} else {
  addResult(
    "Chunked Data",
    "⚠️",
    "No chunked data directory",
    "Run 'npm run chunk' first"
  );
}

if (fs.existsSync(embeddedDir)) {
  const files = fs
    .readdirSync(embeddedDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  embeddedCount = files.length;
  if (embeddedCount > 0) {
    addResult(
      "Embedded Data",
      "✅",
      `Found ${embeddedCount} embedded files`,
      "Ready for database ingestion"
    );
  } else {
    addResult(
      "Embedded Data",
      "⚠️",
      "No embedded files found",
      "Run 'npm run embed' to generate embeddings"
    );
  }
} else {
  addResult(
    "Embedded Data",
    "⚠️",
    "No embedded data directory",
    "Run 'npm run embed' first"
  );
}

results
  .slice(-2)
  .forEach((r) => logResult(r));

// TEST 5: Database Connectivity
async function testDatabase() {
  logSection("TEST 5: Database Connectivity");

  if (!databaseUrl) {
    addResult("Database Connection", "⚠️", "Skipped - No DATABASE_URL");
    logResult(results[results.length - 1]);
    return;
  }

  try {
    const { db } = await import("../src/db/index.js");
    const result = await db.execute(`SELECT NOW()`);
    addResult(
      "Database Connection",
      "✅",
      "Connected to PostgreSQL successfully"
    );
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : String(err);
    addResult(
      "Database Connection",
      "⚠️",
      "Database not running (expected if not started)",
      errorMsg.substring(0, 80)
    );
  }
  logResult(results[results.length - 1]);
}

// TEST 6: Embedding Model Capability
async function testEmbeddingModel() {
  logSection("TEST 6: Embedding Model Setup");

  if (!voyageKey) {
    addResult(
      "Voyage AI Model",
      "❌",
      "Skipped - No Voyage API key"
    );
    logResult(results[results.length - 1]);
    return;
  }

  try {
    const { createVoyage } = await import("voyage-ai-provider");
    const voyage = createVoyage({ apiKey: voyageKey });
    const model = voyage.textEmbeddingModel("voyage-3.5-lite");

    if (model) {
      addResult(
        "Voyage Model",
        "✅",
        "Model initialized successfully",
        "voyage-3.5-lite (1024 dimensions)"
      );
    } else {
      addResult(
        "Voyage Model",
        "❌",
        "Failed to initialize model"
      );
    }
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : String(err);
    addResult(
      "Voyage Model",
      "❌",
      "Error initializing model",
      errorMsg.substring(0, 80)
    );
  }
  logResult(results[results.length - 1]);
}

// Summary Report
async function generateReport() {
  await testDatabase();
  await testEmbeddingModel();

  logSection("SUMMARY REPORT");

  const passed = results.filter((r) => r.status === "✅").length;
  const failed = results.filter((r) => r.status === "❌").length;
  const warnings = results.filter((r) => r.status === "⚠️").length;

  console.log(
    `\n📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings\n`
  );

  if (failed === 0) {
    console.log("✅ Core setup is ready!\n");
    console.log("Workflow to seed database:");
    console.log("  1. npm run db:up       (start PostgreSQL if not running)");
    console.log("  2. npm run embed       (generate embeddings with Voyage)");
    console.log("  3. npm run db:push     (push schema to database)");
    console.log("  4. npm run ingest      (seed database with embeddings)");
    console.log("  5. npm run dev         (start the application)\n");
  } else {
    console.log("❌ Setup incomplete. Please address these issues:\n");
    results.filter((r) => r.status === "❌").forEach((r) => {
      console.log(`   ❌ ${r.name}: ${r.message}`);
    });
    console.log();
  }

  if (warnings > 0) {
    console.log("⚠️ Optional/expected items:\n");
    results.filter((r) => r.status === "⚠️").forEach((r) => {
      console.log(`   ⚠️ ${r.name}: ${r.message}`);
    });
    console.log();
  }
}

generateReport().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
