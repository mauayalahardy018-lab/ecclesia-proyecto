import { app } from "./app.js";
import { pool } from "./infrastructure/db/pool.js";
import { expireQuotes } from "./modules/espacios/repository.js";

const port = Number(process.env.PORT || 4300);
const server = app.listen(port, () => console.log(`Ecclesia API en http://localhost:${port}/api/v1`));
const expire = () => expireQuotes().catch((error) => console.error("No se pudieron vencer cotizaciones", error));
expire();
setInterval(expire, 60_000).unref();
async function shutdown() {
  server.close();
  await pool.end();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
