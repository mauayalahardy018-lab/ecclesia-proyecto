import { query } from "../../infrastructure/db/pool.js";

export async function listChurches(filters) {
  const where = ["c.status='activa'"];
  const values = [];
  const add = (sql, value) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };
  if (filters.state) add("c.state_code=?", filters.state);
  if (filters.municipality) add("c.municipality_code=?", filters.municipality);
  if (filters.locality) add("c.locality_code=?", filters.locality);
  if (filters.type) add("c.type=?", filters.type);
  if (filters.name) add("c.name ILIKE ?", `%${filters.name}%`);
  if (filters.minCapacity != null) add("c.capacity>=?", filters.minCapacity);
  if (filters.maxCapacity != null) add("c.capacity<=?", filters.maxCapacity);
  const base = `FROM churches c JOIN states s ON s.code=c.state_code JOIN municipalities m ON m.code=c.municipality_code JOIN localities l ON l.code=c.locality_code WHERE ${where.join(" AND ")}`;
  const count = await query(`SELECT count(*)::int AS total ${base}`, values);
  values.push(filters.limit, (filters.page - 1) * filters.limit);
  const rows = await query(
    `SELECT c.*,s.name AS state_name,m.name AS municipality_name,l.name AS locality_name ${base} ORDER BY c.name,c.id LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { total: count.rows[0].total, items: rows.rows };
}

export async function findChurch(id, includeClosed = false) {
  const result = await query(
    `SELECT c.*,s.name AS state_name,m.name AS municipality_name,l.name AS locality_name FROM churches c
    JOIN states s ON s.code=c.state_code JOIN municipalities m ON m.code=c.municipality_code JOIN localities l ON l.code=c.locality_code
    WHERE c.id=$1 AND ($2::boolean OR c.status='activa')`,
    [id, includeClosed]
  );
  return result.rows[0] || null;
}

export async function createChurch(input) {
  const result = await query(
    `INSERT INTO churches(name,type,state_code,municipality_code,locality_code,address,capacity,construction_year,phone,email,latitude,longitude,timezone)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      input.name,
      input.type,
      input.stateCode,
      input.municipalityCode,
      input.localityCode,
      input.address,
      input.capacity ?? null,
      input.constructionYear ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.timezone
    ]
  );
  return result.rows[0];
}

export async function updateChurch(id, input) {
  const result = await query(
    `UPDATE churches SET name=$2,type=$3,address=$4,capacity=$5,
    capacity_is_demo=CASE WHEN capacity IS DISTINCT FROM $5 THEN false ELSE capacity_is_demo END,
    construction_year=$6,phone=$7,email=$8,latitude=$9,longitude=$10,timezone=$11,updated_at=now()
    WHERE id=$1 RETURNING *`,
    [
      id,
      input.name,
      input.type,
      input.address,
      input.capacity ?? null,
      input.constructionYear ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.timezone
    ]
  );
  return result.rows[0] || null;
}

export async function closeChurch(id) {
  const result = await query(
    "UPDATE churches SET status='cerrada',closed_at=now(),updated_at=now() WHERE id=$1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

export async function reopenChurch(id) {
  const result = await query(
    "UPDATE churches SET status='activa',closed_at=NULL,updated_at=now() WHERE id=$1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}
