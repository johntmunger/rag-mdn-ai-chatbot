import { db, closeConnection } from "../src/db/index";
import { documentEmbeddings } from "../src/db/schema";

function mockVector() {
  const v = Array.from({ length: 1024 }, () => Math.random() * 2 - 1);
  return `[${v.join(",")}]`;
}

async function run() {
  console.log("Testing insert...");

  await db.insert(documentEmbeddings).values({
    id: "test1",
    text: "hello world",
    characterCount: 11,
    wordCount: 2,
    embedding: mockVector(),
  });

  console.log("Insert success");

  await closeConnection();
}

run();
