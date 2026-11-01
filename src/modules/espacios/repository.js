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

export async function expireQuotes() {
  const result = await query(`WITH expired AS (
    UPDATE space_requests SET status='vencida',updated_at=now()
    WHERE status='cotizada' AND quote_expires_at<=now() RETURNING id
  )
  INSERT INTO space_request_changes(request_id,old_status,new_status,note)
  SELECT id,'cotizada','vencida','Cotización vencida automáticamente' FROM expired RETURNING request_id`);
  return result.rowCount;
}

export const unitsForChurch = async (churchId) =>
  (
    await query(
      `SELECT su.id,su.code,su.status,su.assigned_request_id,st.type FROM space_units su
    JOIN space_types st ON st.id=su.space_type_id WHERE su.church_id=$1 ORDER BY su.code`,
      [churchId]
    )
  ).rows;

export async function createUnit(churchId, typeId, code) {
  return (
    (
      await query(
        `INSERT INTO space_units(church_id,space_type_id,code)
    SELECT $1,st.id,$3 FROM space_types st WHERE st.id=$2 AND st.church_id=$1 AND st.active=true
    RETURNING *`,
        [churchId, typeId, code]
      )
    ).rows[0] || null
  );
}

export async function assignUnit(churchId, requestId, unitId) {
  return transaction(async (client) => {
    const request = (
      await client.query("SELECT id,space_type_id,status FROM space_requests WHERE church_id=$1 AND id=$2 FOR UPDATE", [
        churchId,
        requestId
      ])
    ).rows[0];
    if (!request || request.status !== "aceptada") return null;
    const result = await client.query(
      `UPDATE space_units SET status='asignada',assigned_request_id=$3
      WHERE id=$1 AND church_id=$2 AND space_type_id=$4 AND status='disponible' RETURNING *`,
      [unitId, churchId, requestId, request.space_type_id]
    );
    return result.rows[0] || null;
  });
}

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
