import { query } from "../../infrastructure/db/pool.js";

export const listServices = async (churchId) =>
  (await query("SELECT * FROM services WHERE church_id=$1 AND active=true ORDER BY name", [churchId])).rows;
export const allServices = async (churchId) =>
  (await query("SELECT * FROM services WHERE church_id=$1 ORDER BY name", [churchId])).rows;
export const listTalks = async (churchId) =>
  (await query("SELECT * FROM talks WHERE church_id=$1 AND active=true ORDER BY type", [churchId])).rows;
export const allTalks = async (churchId) =>
  (await query("SELECT * FROM talks WHERE church_id=$1 ORDER BY type", [churchId])).rows;
export async function searchTalks(filters) {
  const values = [filters.municipality];
  const where = ["c.municipality_code=$1", "c.status='activa'", "t.active=true"];
  if (filters.type) {
    values.push(`%${filters.type}%`);
    where.push(`t.type ILIKE $${values.length}`);
  }
  const base = `FROM talks t JOIN churches c ON c.id=t.church_id WHERE ${where.join(" AND ")}`;
  const count = (await query(`SELECT count(*)::int AS total ${base}`, values)).rows[0].total;
  values.push(filters.limit, (filters.page - 1) * filters.limit);
  const rows = (
    await query(
      `SELECT t.id,t.type,t.weekdays,t.local_time,t.sessions,t.price_cents,t.capacity,t.place,t.instructor,c.id AS church_id,c.name AS church_name ${base} ORDER BY t.type,c.name LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    )
  ).rows;
  return { total: count, items: rows };
}
export async function addService(churchId, input) {
  return (
    await query(
      `INSERT INTO services(church_id,name,requirements,duration_minutes,appointment_required,price_kind,price_cents,schedule_text)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        churchId,
        input.name,
        input.requirements,
        input.durationMinutes,
        input.appointmentRequired,
        input.priceKind,
        input.priceCents,
        input.scheduleText
      ]
    )
  ).rows[0];
}
export async function updateService(churchId, id, input) {
  const result = await query(
    `UPDATE services SET name=$3,requirements=$4,duration_minutes=$5,appointment_required=$6,price_kind=$7,price_cents=$8,schedule_text=$9
     WHERE church_id=$1 AND id=$2 RETURNING *`,
    [
      churchId,
      id,
      input.name,
      input.requirements,
      input.durationMinutes,
      input.appointmentRequired,
      input.priceKind,
      input.priceCents,
      input.scheduleText
    ]
  );
  return result.rows[0] || null;
}
export async function setServiceActive(churchId, id, active) {
  return (
    (await query("UPDATE services SET active=$3 WHERE church_id=$1 AND id=$2 RETURNING *", [churchId, id, active]))
      .rows[0] || null
  );
}
export async function addTalk(churchId, input) {
  return (
    await query(
      `INSERT INTO talks(church_id,type,weekdays,local_time,sessions,price_cents,capacity,place,instructor)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        churchId,
        input.type,
        input.weekdays,
        input.localTime,
        input.sessions,
        input.priceCents,
        input.capacity,
        input.place,
        input.instructor
      ]
    )
  ).rows[0];
}
export async function updateTalk(churchId, id, input) {
  const result = await query(
    `UPDATE talks SET type=$3,weekdays=$4,local_time=$5,sessions=$6,price_cents=$7,capacity=$8,place=$9,instructor=$10
     WHERE church_id=$1 AND id=$2 RETURNING *`,
    [
      churchId,
      id,
      input.type,
      input.weekdays,
      input.localTime,
      input.sessions,
      input.priceCents,
      input.capacity,
      input.place,
      input.instructor
    ]
  );
  return result.rows[0] || null;
}
export async function setTalkActive(churchId, id, active) {
  return (
    (await query("UPDATE talks SET active=$3 WHERE church_id=$1 AND id=$2 RETURNING *", [churchId, id, active]))
      .rows[0] || null
  );
}
