import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, query } from "../src/infrastructure/db/pool.js";
import { expireQuotes } from "../src/modules/espacios/repository.js";

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
  it("atiende las consultas paralelas de la ficha y el ranking", async () => {
    const paths = [
      "/rankings?limit=5",
      "/churches/1",
      "/churches/1/heritage",
      "/churches/1/services",
      "/churches/1/talks",
      "/churches/1/masses",
      "/churches/1/space-types"
    ];
    for (let round = 0; round < 5; round++) {
      const responses = await Promise.all(paths.map((path) => request(app).get(`/api/v1${path}`)));
      expect(responses.map((response) => response.status)).toEqual(Array(paths.length).fill(200));
    }
  });
  it("carga el catálogo mínimo y filtra el directorio", async () => {
    const counts = await query(
      "SELECT (SELECT count(*) FROM states)::int AS states, (SELECT count(*) FROM municipalities)::int AS municipalities, (SELECT count(*) FROM churches)::int AS churches, (SELECT count(*) FROM heritage_objects)::int AS objects, (SELECT count(*) FROM priests)::int AS priests, (SELECT count(*) FROM space_requests)::int AS requests"
    );
    expect(counts.rows[0].states).toBe(32);
    expect(counts.rows[0].municipalities).toBe(2478);
    expect(counts.rows[0].churches).toBeGreaterThanOrEqual(40);
    expect(counts.rows[0].objects).toBeGreaterThanOrEqual(120);
    expect(counts.rows[0].priests).toBeGreaterThanOrEqual(15);
    expect(counts.rows[0].requests).toBeGreaterThanOrEqual(12);
    const real = await query(
      "SELECT count(*) FILTER (WHERE source_url IS NOT NULL)::int AS sourced, count(*) FILTER (WHERE name LIKE 'Iglesia de muestra%')::int AS samples, count(DISTINCT state_code)::int AS states, count(DISTINCT municipality_code)::int AS municipalities, count(DISTINCT type)::int AS types, count(*) FILTER (WHERE capacity_is_demo AND capacity IS NOT NULL)::int AS demo_capacities FROM churches"
    );
    expect(real.rows[0]).toMatchObject({
      sourced: 40,
      samples: 0,
      states: 3,
      municipalities: 8,
      types: 6,
      demo_capacities: 40
    });
    const response = await request(app).get("/api/v1/churches?state=31&limit=2");
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items.every((item) => item.state_code === "31")).toBe(true);
    expect(response.body.items.every((item) => item.maps_query && item.source_url)).toBe(true);
    const capacity = await request(app).get("/api/v1/churches?minCapacity=500&limit=100");
    expect(capacity.status).toBe(200);
    expect(capacity.body.items.length).toBeGreaterThan(0);
    expect(capacity.body.items.every((item) => Number(item.capacity) >= 500 && item.capacity_is_demo)).toBe(true);
    const basilica = await request(app).get("/api/v1/churches?type=basilica");
    expect(basilica.status).toBe(200);
    expect(basilica.body.total).toBeGreaterThan(0);
    expect(basilica.body.items[0]).toMatchObject({
      name: "Catedral Basílica de la Asunción de María",
      construction_year: 1561,
      phone: "33 3614 5504"
    });
  });

  it("reporta total, promedio y extremos por cada agrupación sin perder centavos", async () => {
    const treasurer = await login("tesorero@ecclesia.test", "TesoroDemo123!");
    const base = "/api/v1/churches/1/tithes/report?from=2026-01-01&to=2026-12-31";
    const toCents = (pesos) => BigInt(pesos.replace(".", ""));
    for (const groupBy of ["day", "week", "month", "schedule", "priest"]) {
      const response = await request(app).get(`${base}&groupBy=${groupBy}`).set("Authorization", `Bearer ${treasurer}`);
      expect(response.status).toBe(200);
      const report = response.body;
      expect(report.count).toBeGreaterThan(0);
      expect(report.groups.reduce((sum, group) => sum + group.count, 0)).toBe(report.count);
      expect(report.groups.reduce((sum, group) => sum + toCents(group.totalPesos), 0n)).toBe(
        toCents(report.totalPesos)
      );
      for (const group of report.groups) {
        expect(toCents(group.lowest.amountPesos)).toBeLessThanOrEqual(toCents(group.averagePesos));
        expect(toCents(group.averagePesos)).toBeLessThanOrEqual(toCents(group.highest.amountPesos));
        expect(group.lowest.celebrationId).toBeTruthy();
        expect(group.highest.celebrationId).toBeTruthy();
      }
    }
    const empty = await request(app)
      .get("/api/v1/churches/1/tithes/report?from=2035-01-01&to=2035-01-31")
      .set("Authorization", `Bearer ${treasurer}`);
    expect(empty.status).toBe(200);
    expect(empty.body).toMatchObject({ count: 0, totalPesos: "0.00", averagePesos: "0.00", groups: [] });
    expect(empty.body.lowest).toBeNull();
    expect(empty.body.highest).toBeNull();
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

  it("aplica la matriz de permisos al personal nacional y de otra iglesia", async () => {
    const suffix = Date.now();
    const password = "PermisosDemo123!";
    const ids = [];
    try {
      const tokens = {};
      for (const [key, role] of [
        ["admin", "administrador_iglesia"],
        ["treasurer", "tesorero"]
      ]) {
        const email = `permisos-${key}-${suffix}@example.test`;
        const created = await query(
          "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id",
          [`Prueba ${key}`, email, await bcrypt.hash(password, 10), role]
        );
        ids.push(created.rows[0].id);
        await query("INSERT INTO user_churches(user_id,church_id) VALUES($1,1)", [created.rows[0].id]);
        tokens[key] = await login(email, password);
      }
      const coordinator = await login("coordinacion@ecclesia.test", "CoordDemo123!");
      const crossChurch = [
        ["get", "/churches/2/manage", tokens.admin],
        ["put", "/churches/2", tokens.admin],
        ["post", "/churches/2/heritage", tokens.admin],
        ["post", "/churches/2/services", tokens.admin],
        ["post", "/churches/2/talks", tokens.admin],
        ["post", "/churches/2/priests", tokens.admin],
        ["post", "/churches/2/masses", tokens.admin],
        ["post", "/churches/2/celebrations", tokens.admin],
        ["get", "/churches/2/space-requests", tokens.admin],
        ["get", "/churches/2/space-units", tokens.admin],
        ["get", "/churches/2/celebrations", tokens.treasurer],
        ["get", "/churches/2/tithes/report?from=2026-10-01&to=2026-10-31", tokens.treasurer],
        ["post", "/churches/2/celebrations/1/tithe", tokens.treasurer]
      ];
      for (const [method, path, token] of crossChurch) {
        const operation = request(app)[method](`/api/v1${path}`).set("Authorization", `Bearer ${token}`);
        const response = await (method === "get" ? operation : operation.send({}));
        expect(response.status, `${method.toUpperCase()} ${path}`).toBe(403);
      }
      for (const [path, token] of [
        ["/users", tokens.admin],
        ["/users", tokens.treasurer],
        ["/tithes/comparison?from=2026-10-01&to=2026-10-31", tokens.admin],
        ["/churches/1/tithes/report?from=2026-10-01&to=2026-10-31", tokens.admin],
        ["/churches/1/manage", tokens.treasurer]
      ]) {
        const response = await request(app).get(`/api/v1${path}`).set("Authorization", `Bearer ${token}`);
        expect(response.status, path).toBe(403);
      }
      expect((await request(app).get("/api/v1/churches/1/manage")).status).toBe(401);
      expect((await request(app).get("/api/v1/churches/1")).status).toBe(200);
      expect(
        (await request(app).get("/api/v1/churches/1/manage").set("Authorization", `Bearer ${tokens.admin}`)).status
      ).toBe(200);
      expect(
        (
          await request(app)
            .get("/api/v1/churches/1/tithes/report?from=2026-10-01&to=2026-10-31")
            .set("Authorization", `Bearer ${tokens.treasurer}`)
        ).status
      ).toBe(200);
      expect(
        (await request(app).get("/api/v1/churches/2/manage").set("Authorization", `Bearer ${coordinator}`)).status
      ).toBe(200);
      expect((await request(app).get("/api/v1/users").set("Authorization", `Bearer ${coordinator}`)).status).toBe(200);
    } finally {
      for (const id of ids) {
        await query("DELETE FROM user_churches WHERE user_id=$1", [id]);
        await query("DELETE FROM users WHERE id=$1", [id]);
      }
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

  it("corrige un diezmo con auditoría y refleja el importe en el reporte", async () => {
    const treasurer = await login("tesorero@ecclesia.test", "TesoroDemo123!");
    const original = (
      await query(
        "SELECT t.id,t.amount_cents,c.local_date FROM tithes t JOIN celebrations c ON c.id=t.celebration_id WHERE t.church_id=1 ORDER BY t.id LIMIT 1"
      )
    ).rows[0];
    const reason = `Prueba de corrección ${Date.now()}`;
    const newCents = BigInt(original.amount_cents) + 125n;
    const amount = `${newCents / 100n}.${String(newCents % 100n).padStart(2, "0")}`;
    const date = original.local_date.toISOString().slice(0, 10);
    const reportUrl = `/api/v1/churches/1/tithes/report?from=${date}&to=${date}`;
    const before = await request(app).get(reportUrl).set("Authorization", `Bearer ${treasurer}`);
    expect(before.status).toBe(200);
    try {
      const corrected = await request(app)
        .put(`/api/v1/churches/1/tithes/${original.id}`)
        .set("Authorization", `Bearer ${treasurer}`)
        .send({ amount, reason });
      expect(corrected.status).toBe(200);
      expect(corrected.body.amount_cents).toBe(newCents.toString());
      expect(corrected.body.history.at(-1)).toMatchObject({
        old_amount_cents: original.amount_cents,
        new_amount_cents: newCents.toString(),
        reason
      });
      const report = await request(app).get(reportUrl).set("Authorization", `Bearer ${treasurer}`);
      expect(report.status).toBe(200);
      const cents = (pesos) => BigInt(pesos.replace(".", ""));
      expect(cents(report.body.totalPesos) - cents(before.body.totalPesos)).toBe(125n);
    } finally {
      await query("UPDATE tithes SET amount_cents=$2 WHERE id=$1", [original.id, original.amount_cents]);
      await query("DELETE FROM tithe_changes WHERE tithe_id=$1 AND reason=$2", [original.id, reason]);
    }
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
      const churches = (
        await query("SELECT church_id FROM priest_churches WHERE priest_id=$1 ORDER BY church_id LIMIT 2", [
          priest.priest_id
        ])
      ).rows.map((row) => Number(row.church_id));
      expect(churches).toHaveLength(2);
      const payload = { priestId: Number(priest.priest_id), weekday: 0, localTime: "15:00", kind: "especial" };
      const responses = await Promise.all(
        churches.map((churchId) =>
          request(app).post(`/api/v1/churches/${churchId}/masses`).set("Authorization", `Bearer ${admin}`).send(payload)
        )
      );
      try {
        expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
      } finally {
        await query(
          "DELETE FROM mass_schedules WHERE priest_id=$1 AND church_id IN ($2,$3) AND weekday=0 AND local_time='15:00'",
          [priest.priest_id, ...churches]
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

  it("busca pláticas, genera agenda semanal y compara diezmos con permiso nacional", async () => {
    const talks = await request(app).get("/api/v1/talks?municipality=31050&type=prebautismales");
    expect(talks.status).toBe(200);
    expect(talks.body.total).toBeGreaterThan(0);
    const week = await request(app).get("/api/v1/churches/1/masses/week?from=2026-10-30");
    expect(week.status).toBe(200);
    expect(new Set(week.body.items.map((item) => item.localDate)).size).toBe(7);
    const coordinator = await login("coordinacion@ecclesia.test", "CoordDemo123!");
    const treasurer = await login("tesorero@ecclesia.test", "TesoroDemo123!");
    const path = "/api/v1/tithes/comparison?state=31&from=2026-10-01&to=2026-10-30";
    expect((await request(app).get(path).set("Authorization", `Bearer ${treasurer}`)).status).toBe(403);
    const comparison = await request(app).get(path).set("Authorization", `Bearer ${coordinator}`);
    expect(comparison.status).toBe(200);
    expect(comparison.body.items.length).toBeGreaterThan(0);
  });

  it("edita patrimonio y oferta, y protege otra iglesia", async () => {
    const admin = await login("administrador@ecclesia.test", "AdminDemo123!");
    const object = (await query("SELECT * FROM heritage_objects WHERE church_id=1 LIMIT 1")).rows[0];
    const original = {
      name: object.name,
      type: object.type,
      year: object.year_built,
      material: object.material,
      conservation: object.conservation,
      location: object.location_in_church,
      inahCatalogued: object.inah_catalogued
    };
    const service = (await query("SELECT * FROM services WHERE church_id=1 LIMIT 1")).rows[0];
    const serviceInput = {
      name: service.name,
      requirements: service.requirements,
      durationMinutes: service.duration_minutes,
      appointmentRequired: service.appointment_required,
      priceKind: service.price_kind,
      price: (Number(service.price_cents) / 100).toFixed(2),
      scheduleText: service.schedule_text
    };
    try {
      const edited = await request(app)
        .put(`/api/v1/churches/1/heritage/${object.id}`)
        .set("Authorization", `Bearer ${admin}`)
        .send({ ...original, name: "Objeto editado en prueba" });
      expect(edited.status).toBe(200);
      const updated = await request(app)
        .put(`/api/v1/churches/1/services/${service.id}`)
        .set("Authorization", `Bearer ${admin}`)
        .send({ ...serviceInput, name: "Servicio editado en prueba" });
      expect(updated.status).toBe(200);
      const hidden = await request(app)
        .patch(`/api/v1/churches/1/services/${service.id}/active`)
        .set("Authorization", `Bearer ${admin}`)
        .send({ active: false });
      expect(hidden.status).toBe(200);
      expect(
        (await request(app).get("/api/v1/churches/1/services")).body.some(
          (item) => String(item.id) === String(service.id)
        )
      ).toBe(false);
    } finally {
      await query("UPDATE heritage_objects SET name=$2 WHERE id=$1", [object.id, object.name]);
      await query("UPDATE services SET name=$2,active=$3 WHERE id=$1", [service.id, service.name, service.active]);
    }
  });

  it("administra usuarios sin exponer hashes y evita desactivar al último coordinador", async () => {
    const coordinator = await login("coordinacion@ecclesia.test", "CoordDemo123!");
    const existing = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${coordinator}`);
    expect(existing.status).toBe(200);
    expect(existing.body[0]).not.toHaveProperty("password_hash");
    const coordinatorId = existing.body.find((item) => item.role === "coordinacion").id;
    const blocked = await request(app)
      .put(`/api/v1/users/${coordinatorId}`)
      .set("Authorization", `Bearer ${coordinator}`)
      .send({ name: "Coordinación de prueba", role: "coordinacion", active: false, churchIds: [] });
    expect(blocked.status).toBe(409);
    const email = `nuevo-${Date.now()}@example.test`;
    const created = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${coordinator}`)
      .send({ name: "Usuario temporal", email, password: "Temporal12345!", role: "tesorero", churchIds: [1] });
    expect(created.status).toBe(201);
    const id = created.body.id;
    try {
      const updated = await request(app)
        .put(`/api/v1/users/${id}`)
        .set("Authorization", `Bearer ${coordinator}`)
        .send({ name: "Usuario actualizado", role: "tesorero", active: true, churchIds: [2] });
      expect(updated.status).toBe(200);
      const changed = await request(app)
        .put(`/api/v1/users/${id}/password`)
        .set("Authorization", `Bearer ${coordinator}`)
        .send({ password: "NuevaTemporal123!" });
      expect(changed.status).toBe(200);
      expect((await request(app).post("/api/v1/auth/login").send({ email, password: "Temporal12345!" })).status).toBe(
        401
      );
      expect(
        (await request(app).post("/api/v1/auth/login").send({ email, password: "NuevaTemporal123!" })).status
      ).toBe(200);
    } finally {
      await query("DELETE FROM user_churches WHERE user_id=$1", [id]);
      await query("DELETE FROM users WHERE id=$1", [id]);
    }
  });

  it("asigna inventario solo a una solicitud aceptada y del tipo correcto", async () => {
    const admin = await login("administrador@ecclesia.test", "AdminDemo123!");
    const requestRow = (
      await query(
        "SELECT id,church_id,space_type_id FROM space_requests WHERE status='aceptada' AND id NOT IN (SELECT assigned_request_id FROM space_units WHERE assigned_request_id IS NOT NULL) LIMIT 1"
      )
    ).rows[0];
    const churchId = Number(requestRow.church_id);
    const created = await request(app)
      .post(`/api/v1/churches/${churchId}/space-units`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ spaceTypeId: Number(requestRow.space_type_id), code: `PRUEBA-${Date.now()}` });
    expect(created.status).toBe(201);
    const unitId = created.body.id;
    try {
      const assigned = await request(app)
        .post(`/api/v1/churches/${churchId}/space-requests/${requestRow.id}/assign`)
        .set("Authorization", `Bearer ${admin}`)
        .send({ unitId: Number(unitId) });
      expect(assigned.status).toBe(200);
      expect(assigned.body.status).toBe("asignada");
      const duplicate = await request(app)
        .post(`/api/v1/churches/${churchId}/space-requests/${requestRow.id}/assign`)
        .set("Authorization", `Bearer ${admin}`)
        .send({ unitId: Number(unitId) });
      expect(duplicate.status).toBe(409);
    } finally {
      await query("DELETE FROM space_units WHERE id=$1", [unitId]);
    }
  });

  it("vence cotizaciones automáticamente sin esperar una consulta del solicitante", async () => {
    const type = (await query("SELECT id FROM space_types WHERE church_id=1 AND type='nicho'")).rows[0];
    const submitted = await request(app)
      .post("/api/v1/churches/1/space-requests")
      .send({ spaceTypeId: Number(type.id), name: "Vencimiento de prueba", email: "vence@example.test" });
    const id = submitted.body.id;
    try {
      await query(
        "UPDATE space_requests SET status='cotizada',quote_cents=100,quote_conditions='Prueba',quote_issued_at=now()-interval '16 days',quote_expires_at=now()-interval '1 day' WHERE id=$1",
        [id]
      );
      expect(await expireQuotes()).toBeGreaterThanOrEqual(1);
      const row = (await query("SELECT status FROM space_requests WHERE id=$1", [id])).rows[0];
      expect(row.status).toBe("vencida");
      const change = (
        await query("SELECT new_status FROM space_request_changes WHERE request_id=$1 ORDER BY id DESC LIMIT 1", [id])
      ).rows[0];
      expect(change.new_status).toBe("vencida");
    } finally {
      await query("DELETE FROM space_request_changes WHERE request_id=$1", [id]);
      await query("DELETE FROM space_requests WHERE id=$1", [id]);
    }
  });
});
