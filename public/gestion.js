const $ = (id) => document.getElementById(id);
let token = null;
let role = null;
let churches = [];

function node(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value ?? "";
  if (className) element.className = className;
  return element;
}
function option(value, label) {
  const element = node("option", label);
  element.value = value;
  return element;
}
function fields(form) { return Object.fromEntries(new FormData(form)); }
function churchId() { return Number($("church-select").value); }
function status(message) { $("work-status").textContent = message; }

async function api(path, method = "GET", body) {
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.mensaje || `Error ${response.status}`);
  return result;
}

async function refreshChurches(preferredId) {
  churches = await api("/me/churches");
  $("church-select").replaceChildren(...churches.map((church) => option(church.id, `${church.name} (${church.status})`)));
  if (preferredId && churches.some((church) => Number(church.id) === Number(preferredId))) $("church-select").value = preferredId;
  await refreshChurch();
}

async function refreshChurch() {
  const selected = churches.find((church) => Number(church.id) === churchId());
  $("church-current").textContent = selected ? `${selected.name} · ${selected.status}` : "No hay iglesias asignadas.";
  $("church-toggle").textContent = selected?.status === "cerrada" ? "Reactivar iglesia" : "Cerrar iglesia";
  if (!selected || selected.status === "cerrada") return;
  if (role === "tesorero") {
    const celebrations = await api(`/churches/${churchId()}/celebrations`);
    $("celebration-select").replaceChildren(option("", "Selecciona una misa"), ...celebrations.map((item) => option(item.id, `${item.local_date.slice(0, 10)} · ${new Date(item.starts_at).toLocaleTimeString("es-MX")}`)));
  } else {
    const [priests, schedules] = await Promise.all([api(`/churches/${churchId()}/priests`), api(`/churches/${churchId()}/masses`)]);
    const options = priests.map((priest) => option(priest.id, priest.name));
    $("priest-select").replaceChildren(option("", "Selecciona"), ...options);
    $("actual-priest-select").replaceChildren(option("", "Selecciona"), ...priests.map((priest) => option(priest.id, priest.name)));
    $("schedule-select").replaceChildren(option("", "Selecciona"), ...schedules.map((item) => option(item.id, `Día ${item.weekday} · ${item.local_time} · ${item.priest_name}`)));
  }
}

function bind(formId, createBody, path, after) {
  $(formId).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const data = fields(form);
      const result = await api(path(data), "POST", createBody(data));
      status(`Registro guardado correctamente${result.id ? ` (ID ${result.id})` : ""}.`);
      form.reset();
      if (after) await after(result);
    } catch (error) { status(error.message); } finally { button.disabled = false; }
  });
}

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = fields(event.currentTarget);
  try {
    const result = await api("/auth/login", "POST", data);
    token = result.token;
    role = result.user.role;
    $("user-name").textContent = `${result.user.name} · ${role.replaceAll("_", " ")}`;
    for (const element of document.querySelectorAll("[class*='role-']")) {
      element.hidden = !element.classList.contains(`role-${role}`);
    }
    $("login-section").hidden = true;
    $("work-section").hidden = false;
    $("login-form").reset();
    await refreshChurches();
  } catch (error) { $("login-status").textContent = error.message; }
});

$("logout").addEventListener("click", () => {
  token = null; role = null; churches = [];
  $("work-section").hidden = true;
  $("login-section").hidden = false;
  $("report-output").textContent = "";
  $("requests-list").replaceChildren();
  status("");
});
$("church-select").addEventListener("change", () => refreshChurch().catch((error) => status(error.message)));

bind("church-form", (d) => ({ name: d.name, type: d.type, stateCode: d.stateCode, municipalityCode: d.municipalityCode, localityCode: d.localityCode, address: d.address, ...(d.capacity ? { capacity: Number(d.capacity) } : {}) }), () => "/churches", (result) => refreshChurches(result.id));
$("church-toggle").addEventListener("click", async () => {
  const current = churches.find((church) => Number(church.id) === churchId());
  if (!current) return;
  try {
    if (current.status === "cerrada") await api(`/churches/${current.id}/reopen`, "PATCH");
    else await api(`/churches/${current.id}`, "DELETE");
    await refreshChurches(current.id);
    status("Estado de la iglesia actualizado.");
  } catch (error) { status(error.message); }
});

bind("heritage-form", (d) => ({ name: d.name, type: d.type, year: Number(d.year), material: d.material, conservation: d.conservation, location: d.location, inahCatalogued: d.inahCatalogued === "on" }), () => `/churches/${churchId()}/heritage`);
bind("service-form", (d) => ({ name: d.name, requirements: d.requirements, durationMinutes: Number(d.durationMinutes), appointmentRequired: d.appointmentRequired === "on", priceKind: d.priceKind, ...(d.price ? { price: d.price } : {}), scheduleText: d.scheduleText }), () => `/churches/${churchId()}/services`);
bind("talk-form", (d) => ({ type: d.type, weekdays: [Number(d.weekday)], localTime: d.localTime, sessions: Number(d.sessions), capacity: Number(d.capacity), ...(d.price ? { price: d.price } : {}), place: d.place, instructor: d.instructor }), () => `/churches/${churchId()}/talks`);
bind("priest-form", (d) => ({ name: d.name }), () => `/churches/${churchId()}/priests`, refreshChurch);
bind("mass-form", (d) => ({ priestId: Number(d.priestId), weekday: Number(d.weekday), localTime: d.localTime, kind: d.kind }), () => `/churches/${churchId()}/masses`, refreshChurch);
bind("celebration-form", (d) => ({ scheduleId: Number(d.scheduleId), localDate: d.localDate, actualPriestId: Number(d.actualPriestId), ...(d.substitutionReason ? { substitutionReason: d.substitutionReason } : {}) }), () => `/churches/${churchId()}/celebrations`);
bind("tithe-form", (d) => ({ amount: d.amount }), (d) => `/churches/${churchId()}/celebrations/${Number(d.celebrationId)}/tithe`);

$("report-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const params = new URLSearchParams(fields(event.currentTarget));
    const result = await api(`/churches/${churchId()}/tithes/report?${params}`);
    $("report-output").textContent = JSON.stringify(result, null, 2);
    status("Informe cargado.");
  } catch (error) { status(error.message); }
});

$("load-requests").addEventListener("click", async () => {
  try {
    const requests = await api(`/churches/${churchId()}/space-requests`);
    $("requests-list").replaceChildren(...requests.map((item) => {
      const box = node("div", "", "request-item");
      box.append(node("strong", `${item.folio} · ${item.status}`), node("p", item.applicant_name));
      if (["solicitada", "en_revision"].includes(item.status)) {
        const action = item.status === "solicitada" ? "review" : "quote";
        if (action === "quote") {
          const amount = document.createElement("input"); amount.placeholder = "Monto 0.00";
          const conditions = document.createElement("input"); conditions.placeholder = "Condiciones de la cotización";
          box.append(amount, conditions);
          const button = node("button", "Enviar cotización", "action-button");
          button.addEventListener("click", async () => {
            try { await api(`/churches/${churchId()}/space-requests/${item.id}/quote`, "POST", { amount: amount.value, conditions: conditions.value }); status("Cotización enviada."); $("load-requests").click(); } catch (error) { status(error.message); }
          });
          box.append(button);
        } else {
          const button = node("button", "Iniciar revisión", "action-button");
          button.addEventListener("click", async () => {
            try { await api(`/churches/${churchId()}/space-requests/${item.id}/review`, "POST", {}); status("Solicitud en revisión."); $("load-requests").click(); } catch (error) { status(error.message); }
          });
          box.append(button);
        }
      }
      return box;
    }));
    status(`${requests.length} solicitudes cargadas.`);
  } catch (error) { status(error.message); }
});
