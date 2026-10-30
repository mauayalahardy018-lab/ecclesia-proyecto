import { query, transaction } from "../../infrastructure/db/pool.js";

export async function celebration(churchId, id) {
  return (
    (
      await query(
        "SELECT id,church_id,starts_at,actual_priest_id,schedule_id FROM celebrations WHERE church_id=$1 AND id=$2",
        [churchId, id]
      )
    ).rows[0] || null
  );
}
export async function createTithe(churchId, celebrationId, amountCents, userId) {
  return (
    await query(
      `INSERT INTO tithes(celebration_id,church_id,amount_cents,captured_by) VALUES($1,$2,$3,$4) RETURNING *`,
      [celebrationId, churchId, amountCents, userId]
    )
  ).rows[0];
}
export async function changeTithe(churchId, id, amountCents, userId, reason) {
  return transaction(async (client) => {
    const current = await client.query("SELECT * FROM tithes WHERE church_id=$1 AND id=$2 FOR UPDATE", [churchId, id]);
    if (!current.rowCount) return null;
    await client.query(
      "INSERT INTO tithe_changes(tithe_id,old_amount_cents,new_amount_cents,changed_by,reason) VALUES($1,$2,$3,$4,$5)",
      [id, current.rows[0].amount_cents, amountCents, userId, reason]
    );
    return (
      await client.query("UPDATE tithes SET amount_cents=$2,updated_at=now() WHERE id=$1 RETURNING *", [
        id,
        amountCents
      ])
    ).rows[0];
  });
}
export const changes = async (churchId, id) =>
  (
    await query(
      `SELECT tc.old_amount_cents,tc.new_amount_cents,tc.changed_by,tc.reason,tc.changed_at
  FROM tithe_changes tc JOIN tithes t ON t.id=tc.tithe_id WHERE t.church_id=$1 AND t.id=$2 ORDER BY tc.changed_at`,
      [churchId, id]
    )
  ).rows;
export const reportRows = async (churchId, from, to) =>
  (
    await query(
      `SELECT t.id,t.amount_cents,t.celebration_id,c.local_date,c.starts_at,c.actual_priest_id,c.schedule_id,
  ms.weekday,to_char(ms.local_time,'HH24:MI') AS local_time,p.name AS priest_name
  FROM tithes t JOIN celebrations c ON c.id=t.celebration_id
  LEFT JOIN mass_schedules ms ON ms.id=c.schedule_id JOIN priests p ON p.id=c.actual_priest_id
  WHERE t.church_id=$1 AND c.local_date BETWEEN $2 AND $3 ORDER BY c.local_date,c.starts_at`,
      [churchId, from, to]
    )
  ).rows;
