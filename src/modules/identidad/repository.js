import { query, transaction } from "../../infrastructure/db/pool.js";

export const byEmail = async (email) =>
  (
    await query("SELECT id,name,email,role,password_hash FROM users WHERE lower(email)=lower($1) AND active=true", [
      email
    ])
  ).rows[0] || null;

export async function churchesFor(user) {
  const result =
    user.role === "coordinacion"
      ? await query("SELECT id,name,type,state_code,municipality_code,status FROM churches ORDER BY name")
      : await query(
          "SELECT c.id,c.name,c.type,c.state_code,c.municipality_code,c.status FROM churches c JOIN user_churches uc ON uc.church_id=c.id WHERE uc.user_id=$1 ORDER BY c.name",
          [user.id]
        );
  return result.rows;
}

export const list = async () =>
  (
    await query(`SELECT u.id,u.name,u.email,u.role,u.active,COALESCE(array_agg(uc.church_id) FILTER (WHERE uc.church_id IS NOT NULL),'{}') AS church_ids
  FROM users u LEFT JOIN user_churches uc ON uc.user_id=u.id GROUP BY u.id ORDER BY u.name`)
  ).rows;

export async function create(input, passwordHash) {
  return transaction(async (client) => {
    const user = (
      await client.query(
        "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,active",
        [input.name, input.email.toLowerCase(), passwordHash, input.role]
      )
    ).rows[0];
    for (const churchId of new Set(input.churchIds))
      await client.query("INSERT INTO user_churches(user_id,church_id) VALUES($1,$2)", [user.id, churchId]);
    return user;
  });
}

export async function update(id, input) {
  return transaction(async (client) => {
    const current = (await client.query("SELECT id,role,active FROM users WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if (!current) return null;
    if (current.role === "coordinacion" && current.active && (input.role !== "coordinacion" || !input.active)) {
      const remaining = await client.query(
        "SELECT count(*)::int AS total FROM users WHERE role='coordinacion' AND active=true AND id<>$1",
        [id]
      );
      if (remaining.rows[0].total === 0) return { lastCoordinator: true };
    }
    const updated = (
      await client.query("UPDATE users SET name=$2,role=$3,active=$4 WHERE id=$1 RETURNING id,name,email,role,active", [
        id,
        input.name,
        input.role,
        input.active
      ])
    ).rows[0];
    await client.query("DELETE FROM user_churches WHERE user_id=$1", [id]);
    for (const churchId of new Set(input.churchIds))
      await client.query("INSERT INTO user_churches(user_id,church_id) VALUES($1,$2)", [id, churchId]);
    return updated;
  });
}

export const setPassword = async (id, hash) =>
  (await query("UPDATE users SET password_hash=$2 WHERE id=$1 RETURNING id,name,email,role,active", [id, hash]))
    .rows[0] || null;
