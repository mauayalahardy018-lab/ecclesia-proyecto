import { readFile } from "node:fs/promises";
import pg from "pg";
import bcrypt from "bcryptjs";
import { defaultCriteria } from "../src/domain/patrimony.js";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (process.env.NODE_ENV === "production") throw new Error("Los datos ficticios de curso no se cargan en producción");
const geo = JSON.parse(await readFile("data/inegi-geo.json", "utf8"));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const query = (text, params = []) => client.query(text, params);
try {
  await query("BEGIN");
  for (const state of geo.states)
    await query("INSERT INTO states(code,name) VALUES($1,$2) ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name", [
      state.code,
      state.name
    ]);
  for (const municipality of geo.municipalities)
    await query(
      "INSERT INTO municipalities(code,state_code,name) VALUES($1,$2,$3) ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name",
      [municipality.code, municipality.stateCode, municipality.name]
    );
  for (const locality of geo.localities)
    await query(
      "INSERT INTO localities(code,municipality_code,name) VALUES($1,$2,$3) ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name",
      [locality.code, locality.municipalityCode, locality.name]
    );
  if (Number((await query("SELECT count(*) AS total FROM churches")).rows[0].total) > 0) {
    await query("COMMIT");
    console.log("Catálogo actualizado; datos ficticios ya existentes conservados");
    process.exit(0);
  }

  await query("INSERT INTO heritage_criteria(version,reference_year,config,active) VALUES($1,$2,$3,true)", [
    "caso-2026",
    2026,
    JSON.stringify(defaultCriteria)
  ]);
  const users = [];
  for (const [name, email, role, password] of [
    ["Coordinación de prueba", "coordinacion@ecclesia.test", "coordinacion", "CoordDemo123!"],
    ["Administración de prueba", "administrador@ecclesia.test", "administrador_iglesia", "AdminDemo123!"],
    ["Tesorería de prueba", "tesorero@ecclesia.test", "tesorero", "TesoroDemo123!"]
  ]) {
    const result = await query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id", [
      name,
      email,
      await bcrypt.hash(password, 12),
      role
    ]);
    users.push(Number(result.rows[0].id));
  }

  const types = ["catedral", "basilica", "parroquia", "templo", "capilla", "santuario"];
  const churchIds = [];
  for (let index = 0; index < 40; index++) {
    const locality = geo.localities[index % geo.localities.length];
    const municipality = geo.municipalities.find((item) => item.code === locality.municipalityCode);
    const result = await query(
      `INSERT INTO churches(name,type,state_code,municipality_code,locality_code,address,capacity,construction_year,phone,email,timezone)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        `Iglesia de muestra ${String(index + 1).padStart(2, "0")}`,
        types[index % types.length],
        municipality.stateCode,
        municipality.code,
        locality.code,
        `Dirección ficticia ${index + 1}, ${locality.name}`,
        100 + index * 10,
        1700 + index * 5,
        "000-000-0000",
        `muestra${index + 1}@example.test`,
        "America/Mexico_City"
      ]
    );
    const churchId = Number(result.rows[0].id);
    churchIds.push(churchId);
    await query("INSERT INTO user_churches(user_id,church_id) VALUES($1,$2),($3,$2)", [users[1], churchId, users[2]]);
    for (const [name, type, year, material] of [
      [`Imagen de muestra ${index + 1}`, "imagen", 1700 + (index % 8) * 10, "madera"],
      [`Retablo de muestra ${index + 1}`, "retablo", 1780 + (index % 6) * 20, "madera"],
      [`Cáliz de muestra ${index + 1}`, "orfebreria", 1880 + (index % 5) * 15, "metal"]
    ])
      await query(
        `INSERT INTO heritage_objects(church_id,name,type,year_built,material,conservation,location_in_church,inah_catalogued)
      VALUES($1,$2,$3,$4,$5,'bueno','interior',false)`,
        [churchId, name, type, year, material]
      );
    for (const service of ["Bautizo", "Primera comunión", "Confirmación", "Matrimonio"])
      await query(
        `INSERT INTO services(church_id,name,requirements,duration_minutes,appointment_required,price_kind,price_cents,schedule_text)
      VALUES($1,$2,'Consultar con la oficina; dato ficticio',60,true,'fijo',$3,'Sábados 10:00; dato ficticio')`,
        [churchId, service, 50000 + index * 100]
      );
    for (const talk of ["Pláticas prebautismales", "Catecismo"])
      await query(
        `INSERT INTO talks(church_id,type,weekdays,local_time,sessions,price_cents,capacity,place,instructor)
      VALUES($1,$2,ARRAY[6], '09:00', 4, 0, 25, 'Salón ficticio', 'Instructor ficticio')`,
        [churchId, talk]
      );
    for (const space of ["cripta", "nicho", "columbario", "osario"])
      await query("INSERT INTO space_types(church_id,type) VALUES($1,$2)", [churchId, space]);
  }

  const priestIds = [];
  for (let index = 0; index < 15; index++)
    priestIds.push(
      Number(
        (await query("INSERT INTO priests(name) VALUES($1) RETURNING id", [`Sacerdote ficticio ${index + 1}`])).rows[0]
          .id
      )
    );
  const scheduleIds = [];
  for (let index = 0; index < churchIds.length; index++) {
    const priestId = priestIds[index % priestIds.length];
    await query("INSERT INTO priest_churches(priest_id,church_id) VALUES($1,$2)", [priestId, churchIds[index]]);
    for (let weekday = 0; weekday < 7; weekday++) {
      const hour = 7 + Math.floor(index / 15) * 3;
      const localTime = `${String(hour).padStart(2, "0")}:00`;
      const result = await query(
        `INSERT INTO mass_schedules(church_id,priest_id,weekday,local_time,kind,language)
        VALUES($1,$2,$3,$4,$5,'español') RETURNING id`,
        [churchIds[index], priestId, weekday, localTime, weekday === 0 ? "dominical" : "diaria"]
      );
      if (index < 6)
        scheduleIds.push({ id: Number(result.rows[0].id), churchId: churchIds[index], priestId, weekday, hour });
    }
  }

  const now = new Date("2026-10-30T12:00:00Z");
  for (const schedule of scheduleIds) {
    for (let daysBack = 1; daysBack <= 28; daysBack++) {
      const date = new Date(now.getTime() - daysBack * 86400000);
      if (date.getUTCDay() !== schedule.weekday) continue;
      const localDate = date.toISOString().slice(0, 10);
      const startsAt = `${localDate}T${String(schedule.hour).padStart(2, "0")}:00:00-06:00`;
      const celebration = await query(
        `INSERT INTO celebrations(church_id,schedule_id,local_date,starts_at,planned_priest_id,actual_priest_id)
        VALUES($1,$2,$3,$4,$5,$5) RETURNING id`,
        [schedule.churchId, schedule.id, localDate, startsAt, schedule.priestId]
      );
      await query("INSERT INTO tithes(celebration_id,church_id,amount_cents,captured_by) VALUES($1,$2,$3,$4)", [
        celebration.rows[0].id,
        schedule.churchId,
        10000 + daysBack * 25,
        users[2]
      ]);
    }
  }

  const statuses = [
    "solicitada",
    "en_revision",
    "cotizada",
    "sin_disponibilidad",
    "aceptada",
    "rechazada",
    "vencida",
    "cancelada"
  ];
  for (let index = 0; index < 12; index++) {
    const status = statuses[index % statuses.length],
      churchId = churchIds[index];
    const type = await query("SELECT id FROM space_types WHERE church_id=$1 AND type='nicho'", [churchId]);
    const issued = new Date("2026-10-01T12:00:00Z");
    await query(
      `INSERT INTO space_requests(church_id,space_type_id,folio,access_key_hash,applicant_name,applicant_email,status,quote_cents,quote_conditions,quote_issued_at,quote_expires_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        churchId,
        type.rows[0].id,
        `EC-2026-${String(index + 1).padStart(4, "0")}`,
        await bcrypt.hash(`clave-demo-${index + 1}`, 10),
        `Solicitante ficticio ${index + 1}`,
        `solicitante${index + 1}@example.test`,
        status,
        ["cotizada", "aceptada", "rechazada", "vencida"].includes(status) ? 350000 : null,
        status === "cotizada" ? "Condiciones ficticias" : null,
        ["cotizada", "aceptada", "rechazada", "vencida"].includes(status) ? issued : null,
        ["cotizada", "aceptada", "rechazada", "vencida"].includes(status)
          ? new Date(issued.getTime() + 15 * 86400000)
          : null
      ]
    );
  }
  await query("COMMIT");
  console.log(
    `Seeds: ${geo.states.length} entidades, ${geo.municipalities.length} municipios, 40 iglesias, 120 objetos, 15 sacerdotes y 12 solicitudes ficticias`
  );
} catch (error) {
  await query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
