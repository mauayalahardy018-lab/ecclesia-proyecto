import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, query } from "../src/infrastructure/db/pool.js";

const integration = process.env.DATABASE_URL ? describe : describe.skip;
afterAll(async () => {
  if (process.env.DATABASE_URL) await pool.end();
});

async function login(email, password) {
  const response = await request(app).post("/api/v1/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return response.body.token;
}

integration("API con PostgreSQL y semillas", () => {
  it("carga el catálogo mínimo y filtra el directorio", async () => {
    const counts = await query(
      "SELECT (SELECT count(*) FROM states)::int AS states, (SELECT count(*) FROM municipalities)::int AS municipalities, (SELECT count(*) FROM churches)::int AS churches, (SELECT count(*) FROM heritage_objects)::int AS objects, (SELECT count(*) FROM priests)::int AS priests, (SELECT count(*) FROM space_requests)::int AS requests"
    );
    expect(counts.rows[0]).toEqual({
      states: 32,
      municipalities: 2478,
      churches: 40,
      objects: 120,
      priests: 15,
      requests: 12
    });
    const response = await request(app).get("/api/v1/churches?state=31&limit=2");
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items.every((item) => item.state_code === "31")).toBe(true);
  });

  it("protege diezmos por rol y por iglesia", async () => {
    const admin = await login("administrador@ecclesia.test", "AdminDemo123!");
    const treasurer = await login("tesorero@ecclesia.test", "TesoroDemo123!");
    const forbiddenRole = await request(app)
      .get("/api/v1/churches/1/tithes/report?from=2026-10-01&to=2026-10-30")
      .set("Authorization", `Bearer ${admin}`);
    expect(forbiddenRole.status).toBe(403);
    const report = await request(app)
      .get("/api/v1/churches/1/tithes/report?from=2026-10-01&to=2026-10-30")
      .set("Authorization", `Bearer ${treasurer}`);
    expect(report.status).toBe(200);

    const email = `limited-${Date.now()}@example.test`;
    const user = await query(
      "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'tesorero') RETURNING id",
      ["Tesorero limitado", email, await bcrypt.hash("LimitedDemo123!", 10)]
    );
    const userId = user.rows[0].id;
    try {
      await query("INSERT INTO user_churches(user_id,church_id) VALUES($1,1)", [userId]);
      const token = await login(email, "LimitedDemo123!");
      const other = await request(app)
        .get("/api/v1/churches/2/tithes/report?from=2026-10-01&to=2026-10-30")
        .set("Authorization", `Bearer ${token}`);
      expect(other.status).toBe(403);
    } finally {
      await query("DELETE FROM user_churches WHERE user_id=$1", [userId]);
      await query("DELETE FROM users WHERE id=$1", [userId]);
    }
  });

  it("rechaza un segundo diezmo de la misma celebración", async () => {
    const treasurer = await login("tesorero@ecclesia.test", "TesoroDemo123!");
    const row = (await query("SELECT celebration_id FROM tithes WHERE church_id=1 LIMIT 1")).rows[0];
    const response = await request(app)
      .post(`/api/v1/churches/1/celebrations/${row.celebration_id}/tithe`)
      .set("Authorization", `Bearer ${treasurer}`)
      .send({ amount: "50.00" });
    expect(response.status).toBe(409);
  });

  it("rechaza horarios traslapados y oculta una iglesia cerrada", async () => {
    const admin = await login("administrador@ecclesia.test", "AdminDemo123!");
    const existing = (await query("SELECT priest_id,weekday FROM mass_schedules WHERE church_id=1 ORDER BY id LIMIT 1"))
      .rows[0];
    const conflict = await request(app)
      .post("/api/v1/churches/1/masses")
      .set("Authorization", `Bearer ${admin}`)
      .send({ priestId: Number(existing.priest_id), weekday: existing.weekday, localTime: "07:30", kind: "diaria" });
    expect(conflict.status).toBe(409);
    try {
      const closed = await request(app).delete("/api/v1/churches/40").set("Authorization", `Bearer ${admin}`);
      expect(closed.status).toBe(200);
      expect((await request(app).get("/api/v1/churches/40")).status).toBe(404);
      expect((await request(app).get("/api/v1/churches/40/services")).status).toBe(404);
    } finally {
      const reopened = await request(app).patch("/api/v1/churches/40/reopen").set("Authorization", `Bearer ${admin}`);
      expect(reopened.status).toBe(200);
    }
  });

  it.skipIf(/:5433\//.test(process.env.DATABASE_URL || ""))(
    "serializa dos altas concurrentes del mismo sacerdote en PostgreSQL de servidor",
    async () => {
      const admin = await login("administrador@ecclesia.test", "AdminDemo123!");
      const priest = (await query("SELECT priest_id FROM mass_schedules WHERE church_id=1 LIMIT 1")).rows[0];
      const payload = { priestId: Number(priest.priest_id), weekday: 0, localTime: "15:00", kind: "especial" };
      const responses = await Promise.all(
        [1, 2].map(() =>
          request(app).post("/api/v1/churches/1/masses").set("Authorization", `Bearer ${admin}`).send(payload)
        )
      );
      try {
        expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
      } finally {
        await query(
          "DELETE FROM mass_schedules WHERE church_id=1 AND priest_id=$1 AND weekday=0 AND local_time='15:00'",
          [priest.priest_id]
        );
      }
    }
  );

  it("mantiene privada la cotización y vence a los 15 días", async () => {
    const type = (await query("SELECT id FROM space_types WHERE church_id=1 AND type='nicho'")).rows[0];
    const submitted = await request(app)
      .post("/api/v1/churches/1/space-requests")
      .send({ spaceTypeId: Number(type.id), name: "Solicitante de prueba", email: "prueba@example.test" });
    expect(submitted.status).toBe(201);
    const { folio, accessKey, id } = submitted.body;
    try {
      const hidden = await request(app).get(`/api/v1/space-requests/${folio}`).set("x-access-key", "incorrecta");
      expect(hidden.status).toBe(404);
      const admin = await login("administrador@ecclesia.test", "AdminDemo123!");
      const reviewed = await request(app)
        .post(`/api/v1/churches/1/space-requests/${id}/review`)
        .set("Authorization", `Bearer ${admin}`)
        .send({});
      expect(reviewed.status).toBe(200);
      const quoted = await request(app)
        .post(`/api/v1/churches/1/space-requests/${id}/quote`)
        .set("Authorization", `Bearer ${admin}`)
        .send({ amount: "3500.00", conditions: "Condiciones de prueba" });
      expect(quoted.status).toBe(200);
      expect(quoted.body).not.toHaveProperty("access_key_hash");
      const follow = await request(app).get(`/api/v1/space-requests/${folio}`).set("x-access-key", accessKey);
      expect(follow.status).toBe(200);
      expect(follow.body.quote_conditions).toBe("Condiciones de prueba");
      await query("UPDATE space_requests SET quote_expires_at=now()-interval '1 day' WHERE id=$1", [id]);
      const expired = await request(app).get(`/api/v1/space-requests/${folio}`).set("x-access-key", accessKey);
      expect(expired.status).toBe(200);
      expect(expired.body.status).toBe("vencida");
    } finally {
      await query("DELETE FROM space_request_changes WHERE request_id=$1", [id]);
      await query("DELETE FROM space_requests WHERE id=$1", [id]);
    }
  });
});
