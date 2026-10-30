import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://gaia.inegi.org.mx/wscatgeo/v2";
async function data(path) {
  const response = await fetch(`${base}/${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`INEGI ${path}: HTTP ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.datos)) throw new Error(`INEGI ${path}: respuesta sin datos`);
  return body.datos;
}

const states = await data("mgee/");
if (states.length !== 32) throw new Error(`Se esperaban 32 entidades; llegaron ${states.length}`);
const municipalities = [];
for (const state of states) {
  const items = await data(`mgem/${state.cvegeo}`);
  municipalities.push(...items);
}
if (municipalities.length < 2400) throw new Error(`Catálogo municipal incompleto: ${municipalities.length}`);

// Tres entidades y ocho municipios para los datos ficticios del curso.
const selected = ["31050", "31079", "31102", "21001", "21114", "21156", "14039", "14097"];
for (const code of selected)
  if (!municipalities.some((item) => item.cvegeo === code)) throw new Error(`Municipio no encontrado: ${code}`);
const localities = [];
for (const code of selected) {
  const items = await data(`localidades/${code}`);
  const usable = items.find((item) => item.cvegeo?.length === 9 && item.cve_loc !== "0000");
  if (!usable) throw new Error(`Sin localidad usable: ${code}`);
  localities.push(usable);
}

const payload = {
  source: "INEGI Servicio Web del Catálogo Único de Claves Geoestadísticas",
  sourceUrl: "https://www.inegi.org.mx/servicios/catalogounico/",
  downloadedAt: new Date().toISOString(),
  states: states.map((item) => ({ code: item.cvegeo, name: item.nomgeo })),
  municipalities: municipalities.map((item) => ({ code: item.cvegeo, stateCode: item.cve_ent, name: item.nomgeo })),
  localities: localities.map((item) => ({
    code: item.cvegeo,
    municipalityCode: item.cvegeo.slice(0, 5),
    name: item.nomgeo
  }))
};
await mkdir(resolve(project, "data"), { recursive: true });
await writeFile(resolve(project, "data", "inegi-geo.json"), JSON.stringify(payload, null, 2) + "\n");
console.log(
  `${payload.states.length} entidades, ${payload.municipalities.length} municipios y ${payload.localities.length} localidades de muestra`
);
