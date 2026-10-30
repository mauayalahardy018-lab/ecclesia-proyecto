import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const db = new PGlite("./data/pglite-db");
const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 5433 });
await server.start();
console.log("PostgreSQL embebido de desarrollo en 127.0.0.1:5433");

async function stop() {
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
