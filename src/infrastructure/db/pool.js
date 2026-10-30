import pg from "pg";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
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
