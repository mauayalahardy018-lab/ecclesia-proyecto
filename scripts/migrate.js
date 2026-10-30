import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
  );
  const files = (await readdir("migrations")).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  for (const name of files) {
    const exists = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [name]);
    if (exists.rowCount) continue;
    await client.query("BEGIN");
    try {
      await client.query(await readFile(resolve("migrations", name), "utf8"));
      await client.query("INSERT INTO schema_migrations(version) VALUES($1)", [name]);
      await client.query("COMMIT");
      console.log(`Aplicada ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
