import { readFile, writeFile } from "node:fs/promises";
import { URL } from "node:url";
import YAML from "yaml";

const spec = YAML.parse(await readFile(new URL("../public/openapi.yaml", import.meta.url), "utf8"));
const methods = new Set(["get", "post", "put", "patch", "delete"]);
const groups = new Map();

function resolve(value) {
  if (!value?.$ref) return value;
  return value.$ref
    .split("/")
    .slice(1)
    .reduce((part, key) => part[key], spec);
}

function example(schema) {
  const shape = resolve(schema);
  if (!shape) return null;
  if (shape.example !== undefined) return shape.example;
  if (shape.enum?.length) return shape.enum[0];
  if (shape.type === "array") return [example(shape.items)];
  if (shape.type === "object" || shape.properties) {
    return Object.fromEntries((shape.required || []).map((key) => [key, example(shape.properties[key])]));
  }
  if (shape.type === "integer" || shape.type === "number") return shape.minimum || 1;
  if (shape.type === "boolean") return false;
  if (shape.format === "email") return "persona@example.test";
  if (shape.format === "date") return "2026-10-30";
  return "valor";
}

for (const [path, operations] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(operations)) {
    if (!methods.has(method)) continue;
    const tag = operation.tags?.[0] || "Otros";
    const urlPath = path.replace(/\{([^}]+)\}/g, "{{$1}}");
    const parameters = [...(operations.parameters || []), ...(operation.parameters || [])].map(resolve);
    const query = parameters
      .filter((parameter) => parameter.in === "query")
      .map((parameter) => ({ key: parameter.name, value: String(parameter.schema?.default || ""), disabled: true }));
    const header = parameters
      .filter((parameter) => parameter.in === "header")
      .map((parameter) => ({ key: parameter.name, value: `{{${parameter.name.replaceAll("-", "")}}}` }));
    const bodySchema = resolve(operation.requestBody)?.content?.["application/json"]?.schema;
    const request = {
      method: method.toUpperCase(),
      header,
      url: { raw: `{{baseUrl}}${urlPath}`, host: ["{{baseUrl}}"], path: urlPath.slice(1).split("/"), query },
      description: operation.summary || ""
    };
    if (bodySchema) {
      request.header.push({ key: "Content-Type", value: "application/json" });
      request.body = {
        mode: "raw",
        raw: JSON.stringify(example(bodySchema), null, 2),
        options: { raw: { language: "json" } }
      };
    }
    if (operation.security?.length || spec.security?.length) {
      request.auth = { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] };
    }
    const group = groups.get(tag) || [];
    group.push({ name: `${method.toUpperCase()} ${path}`, request, response: [] });
    groups.set(tag, group);
  }
}

const collection = {
  info: {
    name: "Ecclesia API",
    description:
      "Colección generada desde public/openapi.yaml. Inicia sesión, copia el JWT a token y completa los ejemplos según el flujo. Usa datos ficticios.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [...groups].map(([name, item]) => ({ name, item })),
  variable: [
    { key: "baseUrl", value: "http://localhost:4300/api/v1" },
    { key: "token", value: "" },
    { key: "churchId", value: "1" },
    { key: "id", value: "1" },
    { key: "folio", value: "" },
    { key: "xaccesskey", value: "" }
  ]
};

await writeFile(
  new URL("../docs/ecclesia.postman_collection.json", import.meta.url),
  `${JSON.stringify(collection, null, 2)}\n`
);
console.log(`Colección Postman: ${collection.item.reduce((total, group) => total + group.item.length, 0)} solicitudes`);
