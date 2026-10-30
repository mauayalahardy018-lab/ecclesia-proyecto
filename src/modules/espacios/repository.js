import { query, transaction } from "../../infrastructure/db/pool.js";

export const publicTypes = async (churchId) =>
  (
    await query(
      `SELECT st.id,st.type FROM space_types st JOIN churches c ON c.id=st.church_id
  WHERE st.church_id=$1 AND st.active=true AND c.status='activa' ORDER BY st.type`,
      [churchId]
    )
  ).rows;
export const hasType = async (churchId, typeId) =>
  (await query("SELECT 1 FROM space_types WHERE church_id=$1 AND id=$2 AND active=true", [churchId, typeId])).rowCount >
  0;
export const churchActive = async (churchId) =>
  (await query("SELECT 1 FROM churches WHERE id=$1 AND status='activa'", [churchId])).rowCount > 0;
export const byFolio = async (folio) =>
  (await query("SELECT * FROM space_requests WHERE folio=$1", [folio])).rows[0] || null;
export const byId = async (churchId, id) =>
  (await query("SELECT * FROM space_requests WHERE church_id=$1 AND id=$2", [churchId, id])).rows[0] || null;
export const forChurch = async (churchId) =>
  (
    await query(
      "SELECT id,church_id,space_type_id,folio,applicant_name,applicant_email,applicant_phone,status,quote_cents,quote_conditions,quote_issued_at,quote_expires_at,created_at FROM space_requests WHERE church_id=$1 ORDER BY created_at DESC LIMIT 200",
      [churchId]
    )
  ).rows;

export async function create(churchId, input) {
  return transaction(async (client) => {
    const record = (
      await client.query(
        `INSERT INTO space_requests(church_id,space_type_id,folio,access_key_hash,applicant_name,applicant_email,applicant_phone)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,church_id,space_type_id,folio,status,created_at`,
        [
          churchId,
          input.spaceTypeId,
          input.folio,
          input.accessKeyHash,
          input.name,
          input.email || null,
          input.phone || null
        ]
      )
    ).rows[0];
    await client.query(
      "INSERT INTO space_request_changes(request_id,new_status,note) VALUES($1,'solicitada','Solicitud recibida')",
      [record.id]
    );
    return record;
  });
}

export async function transition(record, next, actorId, note, quote) {
  return transaction(async (client) => {
    const locked = (await client.query("SELECT * FROM space_requests WHERE id=$1 FOR UPDATE", [record.id])).rows[0];
    if (!locked || locked.status !== record.status) return null;
    const result = (
      await client.query(
        `UPDATE space_requests SET status=$2,quote_cents=COALESCE($3,quote_cents),quote_conditions=COALESCE($4,quote_conditions),
      quote_issued_at=COALESCE($5,quote_issued_at),quote_expires_at=COALESCE($6,quote_expires_at),updated_at=now() WHERE id=$1 RETURNING *`,
        [
          record.id,
          next,
          quote?.cents ?? null,
          quote?.conditions ?? null,
          quote?.issuedAt ?? null,
          quote?.expiresAt ?? null
        ]
      )
    ).rows[0];
    await client.query(
      "INSERT INTO space_request_changes(request_id,old_status,new_status,changed_by,note) VALUES($1,$2,$3,$4,$5)",
      [record.id, locked.status, next, actorId || null, note || null]
    );
    return result;
  });
}
