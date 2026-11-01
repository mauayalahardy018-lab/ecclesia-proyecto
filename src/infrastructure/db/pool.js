import pg from "pg";

const max = Number(process.env.DB_POOL_MAX || 10);
if (!Number.isInteger(max) || max < 1 || max > 100) throw new Error("DB_POOL_MAX debe estar entre 1 y 100");
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max });
export const query = (text, params = []) => pool.query(text, params);

export async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const value = await work(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
