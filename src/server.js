import { app } from "./app.js";
import { pool } from "./infrastructure/db/pool.js";

const port = Number(process.env.PORT || 4300);
const server = app.listen(port, () => console.log(`Ecclesia API en http://localhost:${port}/api/v1`));
async function shutdown() {
  server.close();
  await pool.end();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
