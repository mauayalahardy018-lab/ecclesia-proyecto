import { pool, query, transaction } from "../../infrastructure/db/pool.js";

export const withPriestLock = (priestId, work) =>
  transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [priestId]);
    return work(client);
  });

export async function churchTimezone(churchId) {
  return (
    (await query("SELECT timezone FROM churches WHERE id=$1 AND status='activa'", [churchId])).rows[0]?.timezone || null
  );
}
export async function createPriest(churchId, name) {
  return transaction(async (client) => {
    const priest = (await client.query("INSERT INTO priests(name) VALUES($1) RETURNING *", [name])).rows[0];
    await client.query("INSERT INTO priest_churches(priest_id,church_id) VALUES($1,$2)", [priest.id, churchId]);
    return priest;
  });
}
export async function assignPriest(churchId, priestId) {
  const priest = await query("SELECT id,name FROM priests WHERE id=$1 AND active=true", [priestId]);
  if (!priest.rowCount) return null;
  await query("INSERT INTO priest_churches(priest_id,church_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [
    priestId,
    churchId
  ]);
  return priest.rows[0];
}
export const assigned = async (churchId, priestId) =>
  (await query("SELECT 1 FROM priest_churches WHERE church_id=$1 AND priest_id=$2", [churchId, priestId])).rowCount > 0;
export const listChurchPriests = async (churchId) =>
  (
    await query(
      "SELECT p.id,p.name FROM priests p JOIN priest_churches pc ON pc.priest_id=p.id WHERE pc.church_id=$1 AND p.active=true ORDER BY p.name",
      [churchId]
    )
  ).rows;
export const priestSchedules = async (priestId, client = pool) =>
  (
    await client.query(
      `SELECT ms.id,ms.priest_id AS "priestId",ms.weekday,to_char(ms.local_time,'HH24:MI') AS "localTime",ms.duration_minutes AS "durationMinutes",c.timezone,c.name AS church_name
  FROM mass_schedules ms JOIN churches c ON c.id=ms.church_id WHERE ms.priest_id=$1 AND ms.active=true AND c.status='activa'`,
      [priestId]
    )
  ).rows;
export const churchSchedules = async (churchId) =>
  (
    await query(
      `SELECT ms.*,p.name AS priest_name FROM mass_schedules ms JOIN priests p ON p.id=ms.priest_id WHERE ms.church_id=$1 AND ms.active=true ORDER BY ms.weekday,ms.local_time`,
      [churchId]
    )
  ).rows;
export const schedule = async (id) =>
  (
    await query(
      `SELECT ms.*,c.timezone FROM mass_schedules ms JOIN churches c ON c.id=ms.church_id WHERE ms.id=$1 AND ms.active=true`,
      [id]
    )
  ).rows[0] || null;
export const createSchedule = async (churchId, input, client = pool) =>
  (
    await client.query(
      `INSERT INTO mass_schedules(church_id,priest_id,weekday,local_time,duration_minutes,kind,language) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [churchId, input.priestId, input.weekday, input.localTime, input.durationMinutes, input.kind, input.language]
    )
  ).rows[0];
export const priestCelebrationConflict = async (priestId, start, end, client = pool) =>
  (
    await client.query(
      `SELECT 1 FROM celebrations ce LEFT JOIN mass_schedules ms ON ms.id=ce.schedule_id WHERE ce.actual_priest_id=$1 AND ce.starts_at<$3 AND ce.starts_at + COALESCE(ms.duration_minutes,60)*interval '1 minute'>$2 LIMIT 1`,
      [priestId, start, end]
    )
  ).rowCount > 0;
export const createCelebration = async (input, client = pool) =>
  (
    await client.query(
      `INSERT INTO celebrations(church_id,schedule_id,local_date,starts_at,planned_priest_id,actual_priest_id,substitution_reason,changed_by)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        input.churchId,
        input.scheduleId,
        input.localDate,
        input.startsAt,
        input.plannedPriestId,
        input.actualPriestId,
        input.substitutionReason,
        input.changedBy
      ]
    )
  ).rows[0];
export const churchCelebrations = async (churchId) =>
  (await query("SELECT * FROM celebrations WHERE church_id=$1 ORDER BY starts_at DESC LIMIT 200", [churchId])).rows;
