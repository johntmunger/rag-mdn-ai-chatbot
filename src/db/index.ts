import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Please add it to your .env file.\n\n" +
    "Example for local Docker setup:\n" +
    'DATABASE_URL="postgresql://example:example@localhost:5455/example"'
  );
}

// Create postgres connection
// Default Docker connection: postgresql://example:example@localhost:5455/example
const connectionString = process.env.DATABASE_URL;

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// For migrations (max 1 connection)
const migrationClient = postgres(connectionString, { max: 1 });
export const migrationDb = drizzle(migrationClient, { schema });

// Helper to close connections
export async function closeConnection() {
  await queryClient.end();
  await migrationClient.end();
}

// Export schema
export { schema };
