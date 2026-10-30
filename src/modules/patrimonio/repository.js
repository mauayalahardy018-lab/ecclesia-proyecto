import { query, transaction } from "../../infrastructure/db/pool.js";

export async function criteria() {
  return (await query("SELECT version,reference_year,config FROM heritage_criteria WHERE active=true")).rows[0] || null;
}

export async function setCriteria(input) {
  return transaction(async (client) => {
    await client.query("UPDATE heritage_criteria SET active=false WHERE active=true");
    const result = await client.query(
      "INSERT INTO heritage_criteria(version,reference_year,config,active) VALUES($1,$2,$3,true) RETURNING version,reference_year,config",
      [input.version, input.referenceYear, JSON.stringify(input.config)]
    );
    return result.rows[0];
  });
}

export const objectsForChurch = async (churchId) =>
  (await query("SELECT * FROM heritage_objects WHERE church_id=$1 ORDER BY id", [churchId])).rows;

export async function addObject(churchId, input) {
  const result = await query(
    `INSERT INTO heritage_objects(church_id,name,type,year_built,century,material,conservation,location_in_church,inah_catalogued)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      churchId,
      input.name,
      input.type,
      input.year ?? null,
      input.century ?? null,
      input.material,
      input.conservation,
      input.location,
      input.inahCatalogued
    ]
  );
  return result.rows[0];
}

export async function changeStatus(churchId, id, status) {
  const result = await query(
    "UPDATE heritage_objects SET status=$3,updated_at=now() WHERE church_id=$1 AND id=$2 RETURNING *",
    [churchId, id, status]
  );
  return result.rows[0] || null;
}

export async function rankingCandidates(filters) {
  const values = [];
  const where = ["c.status='activa'"];
  for (const [column, value] of [
    ["state_code", filters.state],
    ["municipality_code", filters.municipality],
    ["locality_code", filters.locality]
  ])
    if (value) {
      values.push(value);
      where.push(`c.${column}=$${values.length}`);
    }
  const churches = await query(
    `SELECT c.id,c.name,c.type,c.state_code,c.municipality_code,c.locality_code,count(o.id)::int AS registered_count
    FROM churches c JOIN heritage_objects o ON o.church_id=c.id WHERE ${where.join(" AND ")} GROUP BY c.id ORDER BY c.id`,
    values
  );
  const ids = churches.rows.map((row) => row.id);
  if (!ids.length) return [];
  const objects = await query(
    "SELECT church_id,type,year_built,century,status,inah_catalogued FROM heritage_objects WHERE church_id=ANY($1::bigint[])",
    [ids]
  );
  const byChurch = new Map(ids.map((id) => [String(id), []]));
  for (const object of objects.rows) byChurch.get(String(object.church_id)).push(object);
  return churches.rows.map((church) => ({ church, objects: byChurch.get(String(church.id)) }));
}
