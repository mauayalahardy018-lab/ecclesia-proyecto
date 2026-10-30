import { readFile } from "node:fs/promises";
import YAML from "yaml";

const source = await readFile("public/openapi.yaml", "utf8");
const document = YAML.parse(source, { uniqueKeys: true });
if (document.openapi !== "3.1.0" || !document.paths) throw new Error("Contrato OpenAPI inválido");
let operations = 0;
for (const [path, methods] of Object.entries(document.paths)) {
  if (!path.startsWith("/")) throw new Error(`Ruta inválida: ${path}`);
  for (const [method, definition] of Object.entries(methods)) {
    if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
    if (!definition.summary || !definition.responses) throw new Error(`Operación incompleta: ${method} ${path}`);
    operations++;
  }
}
console.log(`OpenAPI 3.1 válido: ${operations} operaciones`);
