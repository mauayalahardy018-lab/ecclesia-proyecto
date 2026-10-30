const $ = (id) => document.getElementById(id);
const state = { page: 1, limit: 9, total: 0 };

async function api(path) {
  const response = await fetch(`/api/v1${path}`);
  if (!response.ok) throw new Error(`No se pudo cargar la información (${response.status})`);
  return response.json();
}

function option(value, label) {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = label;
  return node;
}

function fillSelect(id, rows, label) {
  const select = $(id);
  select.replaceChildren(option("", label), ...rows.map((row) => option(row.code, row.name)));
  select.disabled = rows.length === 0;
}

function text(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value ?? "";
  if (className) node.className = className;
  return node;
}

function formatType(type) {
  return ({ basilica: "Basílica", parroquia: "Parroquia" })[type] || (type ? type[0].toUpperCase() + type.slice(1) : "Iglesia");
}

async function listChurches() {
  $("results-status").textContent = "Cargando iglesias…";
  const params = new URLSearchParams({ page: state.page, limit: state.limit });
  for (const [input, key] of [["state", "state"], ["municipality", "municipality"], ["locality", "locality"], ["type", "type"], ["name", "name"], ["capacity", "minCapacity"]]) {
    const value = $(input).value.trim();
    if (value) params.set(key, value);
  }
  try {
    const result = await api(`/churches?${params}`);
    state.total = result.total;
    const cards = result.items.map((church) => {
      const card = text("article", "", "card");
      card.append(text("span", formatType(church.type), "tag"), text("h3", church.name), text("p", `${church.locality_name}, ${church.municipality_name}, ${church.state_name}`), text("small", church.capacity == null ? "Capacidad sin registrar" : `Capacidad: ${church.capacity} personas`));
      const button = text("button", "Ver ficha ↗");
      button.type = "button";
      button.addEventListener("click", () => showDetail(church.id));
      card.append(button);
      return card;
    });
    $("church-list").replaceChildren(...cards);
    $("results-status").textContent = `${result.total} ${result.total === 1 ? "iglesia encontrada" : "iglesias encontradas"}`;
    $("page-label").textContent = `Página ${state.page} de ${Math.max(1, Math.ceil(result.total / state.limit))}`;
    $("prev").disabled = state.page === 1;
    $("next").disabled = state.page * state.limit >= result.total;
  } catch (error) {
    $("church-list").replaceChildren();
    $("results-status").textContent = error.message;
  }
}

function detailPanel(title, items, render) {
  const panel = text("section", "", "detail-panel");
  panel.append(text("h3", title));
  if (!items.length) panel.append(text("p", "No hay registros disponibles."));
  else {
    const list = document.createElement("ul");
    list.append(...items.map((item) => text("li", render(item))));
    panel.append(list);
  }
  return panel;
}

function requestPanel(churchId, types) {
  const panel = text("section", "", "detail-panel");
  panel.append(text("h3", "Solicitar un espacio"), text("p", "Envía tu solicitud sin crear una cuenta. La cotización será privada."));
  if (!types.length) { panel.append(text("p", "Esta iglesia no ofrece espacios actualmente.")); return panel; }
  const form = document.createElement("form");
  form.className = "request-form";
  const select = document.createElement("select");
  select.required = true;
  select.append(option("", "Elige un tipo de espacio"), ...types.map((item) => option(item.id, item.type)));
  const name = document.createElement("input"); name.required = true; name.placeholder = "Nombre completo";
  const email = document.createElement("input"); email.type = "email"; email.placeholder = "Correo electrónico";
  const phone = document.createElement("input"); phone.type = "tel"; phone.placeholder = "Teléfono";
  const submit = text("button", "Enviar solicitud"); submit.type = "submit";
  const status = text("p", "", "status"); status.setAttribute("role", "status");
  form.append(select, name, email, phone, submit, status);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!email.value.trim() && !phone.value.trim()) { status.textContent = "Indica correo o teléfono."; return; }
    submit.disabled = true; status.textContent = "Enviando…";
    try {
      const response = await fetch(`/api/v1/churches/${churchId}/space-requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spaceTypeId: Number(select.value), name: name.value.trim(), ...(email.value.trim() ? { email: email.value.trim() } : {}), ...(phone.value.trim() ? { phone: phone.value.trim() } : {}) }) });
      if (!response.ok) throw new Error("No se pudo enviar la solicitud. Revisa los datos.");
      const result = await response.json();
      status.textContent = `Solicitud enviada. Guarda estos datos: folio ${result.folio} · clave ${result.accessKey}. La clave solo se muestra ahora.`;
      $("follow-folio").value = result.folio;
      $("follow-key").value = result.accessKey;
      form.reset();
    } catch (error) { status.textContent = error.message; } finally { submit.disabled = false; }
  });
  panel.append(form);
  return panel;
}

async function showDetail(id) {
  $("detail").hidden = false;
  $("detail-content").replaceChildren(text("p", "Cargando ficha…"));
  $("detail").scrollIntoView({ behavior: "smooth" });
  try {
    const [church, heritage, services, talks, masses, spaces] = await Promise.all([
      api(`/churches/${id}`), api(`/churches/${id}/heritage`), api(`/churches/${id}/services`),
      api(`/churches/${id}/talks`), api(`/churches/${id}/masses`), api(`/churches/${id}/space-types`)
    ]);
    const header = text("div", "", "detail-header");
    header.append(text("p", formatType(church.type), "eyebrow"), text("h2", church.name), text("p", `${church.address} · ${church.locality_name}, ${church.state_name}`), text("p", `Capacidad: ${church.capacity ?? "sin registrar"} · Construcción: ${church.construction_year ?? "sin registrar"}`));
    if (church.latitude != null && church.longitude != null) {
      const map = text("a", "Abrir ubicación en Google Maps ↗");
      map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${church.latitude},${church.longitude}`)}`;
      map.target = "_blank";
      map.rel = "noopener noreferrer";
      header.append(map);
    }
    const grid = text("div", "", "detail-grid");
    grid.append(
      detailPanel("Patrimonio", heritage.objects, (x) => `${x.name} · ${x.status}`),
      detailPanel("Servicios", services, (x) => `${x.name} · ${x.schedule_text}`),
      detailPanel("Pláticas", talks, (x) => `${x.type} · ${x.local_time}`),
      detailPanel("Misas", masses, (x) => `Día ${x.weekday} · ${x.local_time}`),
      detailPanel("Espacios disponibles", spaces, (x) => x.type),
      requestPanel(id, spaces)
    );
    $("detail-content").replaceChildren(header, text("p", `Índice patrimonial: ${heritage.index.points} puntos · ${heritage.index.distinction ?? "Sin distinción"}`), grid);
  } catch (error) {
    $("detail-content").replaceChildren(text("p", error.message));
  }
}

async function listRanking() {
  try {
    const result = await api("/rankings?limit=5");
    $("ranking-status").textContent = `${result.total} iglesias con patrimonio registrado`;
    $("ranking-list").replaceChildren(...result.items.map((item, index) => {
      const row = text("div", "", "rank-row");
      const name = text("span", item.name);
      name.append(text("small", item.distinction ?? formatType(item.type)));
      row.append(text("strong", String(index + 1).padStart(2, "0")), name, text("b", `${item.points} pts`));
      return row;
    }));
  } catch (error) { $("ranking-status").textContent = error.message; }
}

$("state").addEventListener("change", async () => {
  fillSelect("municipality", [], "Todos"); fillSelect("locality", [], "Todas");
  if ($("state").value) try { fillSelect("municipality", await api(`/geo/municipalities?state=${$("state").value}`), "Todos"); } catch (error) { $("results-status").textContent = error.message; }
});
$("municipality").addEventListener("change", async () => {
  fillSelect("locality", [], "Todas");
  if ($("municipality").value) try { fillSelect("locality", await api(`/geo/localities?municipality=${$("municipality").value}`), "Todas"); } catch (error) { $("results-status").textContent = error.message; }
});
$("search-form").addEventListener("submit", (event) => { event.preventDefault(); state.page = 1; listChurches(); });
$("prev").addEventListener("click", () => { state.page--; listChurches(); });
$("next").addEventListener("click", () => { state.page++; listChurches(); });
$("close-detail").addEventListener("click", () => { $("detail").hidden = true; $("explorar").scrollIntoView({ behavior: "smooth" }); });
$("follow-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const folio = $("follow-folio").value.trim();
  const key = $("follow-key").value.trim();
  $("follow-status").textContent = "Consultando…";
  $("follow-result").replaceChildren();
  try {
    const response = await fetch(`/api/v1/space-requests/${encodeURIComponent(folio)}`, { headers: { "x-access-key": key } });
    if (!response.ok) throw new Error("Folio o clave incorrectos.");
    const record = await response.json();
    $("follow-status").textContent = `Estado: ${record.status.replaceAll("_", " ")}`;
    const result = text("div", "", "detail-panel");
    result.append(text("h3", `Solicitud ${folio}`));
    if (record.quote_cents != null) result.append(text("p", `Cotización: $${(Number(record.quote_cents) / 100).toFixed(2)} MXN`));
    if (record.quote_conditions) result.append(text("p", record.quote_conditions));
    if (record.quote_expires_at) result.append(text("p", `Vigente hasta: ${new Date(record.quote_expires_at).toLocaleString("es-MX")}`));
    if (["cotizada", "solicitada", "en_revision"].includes(record.status)) {
      const actions = record.status === "cotizada" ? [["accept", "Aceptar"], ["reject", "Rechazar"], ["cancel", "Cancelar"]] : [["cancel", "Cancelar"]];
      for (const [action, label] of actions) {
        const button = text("button", label, "action-button"); button.type = "button";
        button.addEventListener("click", async () => {
          button.disabled = true;
          const changed = await fetch(`/api/v1/space-requests/${encodeURIComponent(folio)}/${action}`, { method: "POST", headers: { "x-access-key": key } });
          $("follow-status").textContent = changed.ok ? "Solicitud actualizada. Consulta de nuevo para ver el estado." : "No se pudo cambiar el estado.";
        });
        result.append(button);
      }
    }
    $("follow-result").append(result);
  } catch (error) { $("follow-status").textContent = error.message; }
});

try { fillSelect("state", await api("/geo/states"), "Todos los estados"); } catch (error) { $("results-status").textContent = error.message; }
await Promise.all([listChurches(), listRanking()]);
