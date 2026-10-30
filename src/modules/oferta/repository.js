import { query } from "../../infrastructure/db/pool.js";

export const listServices = async (churchId) =>
  (await query("SELECT * FROM services WHERE church_id=$1 AND active=true ORDER BY name", [churchId])).rows;
export const listTalks = async (churchId) =>
  (await query("SELECT * FROM talks WHERE church_id=$1 AND active=true ORDER BY type", [churchId])).rows;
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
