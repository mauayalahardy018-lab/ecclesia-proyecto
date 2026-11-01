export function createExtra({ api, churchId, status, role, refreshChurches }) {
  const root = document.querySelector(".staff-grid");
  const panels = [];
  const loaders = [];
  const make = (title, html) => {
    const section = document.createElement("section");
    section.className = "detail-panel";
    section.innerHTML = `<h3>${title}</h3>${html}`;
    root.append(section);
    panels.push(section);
    return section;
  };
  const run = async (work, message = "Cambios guardados.") => {
    try { await work(); status(message); } catch (error) { status(error.message); }
  };
  const data = (form) => Object.fromEntries(new FormData(form));
  const option = (value, label) => {
    const item = document.createElement("option"); item.value = value; item.textContent = label; return item;
  };
  const fill = (select, items, label) => select.replaceChildren(option("", label), ...items.map((item) => option(item.id, item.label)));

  if (role !== "tesorero") {
    const church = make("Editar iglesia", `<form class="staff-form">
      <label>Nombre<input name="name" required></label><label>Tipo<select name="type"><option value="catedral">Catedral</option><option value="basilica">Basílica</option><option value="parroquia">Parroquia</option><option value="templo">Templo</option><option value="capilla">Capilla</option><option value="santuario">Santuario</option></select></label>
      <label>Dirección<input name="address" required></label><label>Capacidad<input name="capacity" type="number" min="0"></label><label>Año de construcción<input name="constructionYear" type="number" min="1" max="2100"></label><label>Teléfono<input name="phone"></label><label>Correo<input name="email" type="email"></label><label>Latitud<input name="latitude" type="number" step="any" min="-90" max="90"></label><label>Longitud<input name="longitude" type="number" step="any" min="-180" max="180"></label><label>Zona horaria IANA<input name="timezone" required></label><button type="submit">Guardar iglesia</button></form>`);
    const form = church.querySelector("form");
    const load = async () => {
      const item = await api(`/churches/${churchId()}/manage`);
      for (const [name, value] of Object.entries({ name: item.name, type: item.type, address: item.address, capacity: item.capacity, constructionYear: item.construction_year, phone: item.phone, email: item.email, latitude: item.latitude, longitude: item.longitude, timezone: item.timezone })) form.elements[name].value = value ?? "";
    };
    form.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      const v = data(form);
      await api(`/churches/${churchId()}`, "PUT", { name: v.name, type: v.type, address: v.address,
        ...(v.capacity ? { capacity: Number(v.capacity) } : {}), ...(v.constructionYear ? { constructionYear: Number(v.constructionYear) } : {}),
        ...(v.phone ? { phone: v.phone } : {}), ...(v.email ? { email: v.email } : {}),
        ...(v.latitude ? { latitude: Number(v.latitude) } : {}), ...(v.longitude ? { longitude: Number(v.longitude) } : {}), timezone: v.timezone });
      await refreshChurches(churchId());
    }, "Datos de iglesia actualizados."); });
    loaders.push(load);

    const heritage = make("Editar patrimonio", `<label class="staff-select">Objeto<select class="record-select"></select></label><form class="staff-form separated">
      <label>Nombre<input name="name" required></label><label>Tipo<select name="type"><option value="imagen">Imagen</option><option value="retablo">Retablo</option><option value="pintura">Pintura</option><option value="mural">Mural</option><option value="organo">Órgano</option><option value="piano">Piano</option><option value="orfebreria">Orfebrería</option><option value="mobiliario_liturgico">Mobiliario</option><option value="documento">Documento</option><option value="otro">Otro</option></select></label>
      <label>Año exacto<input name="year" type="number" min="1" max="2100"></label><label>Siglo, si no hay año<input name="century" type="number" min="1" max="21"></label><label>Material<input name="material" required></label><label>Conservación<input name="conservation" required></label><label>Ubicación interna<input name="location" required></label><label><input name="inahCatalogued" type="checkbox"> Catalogado por INAH</label><button type="submit">Guardar cambios</button></form><div class="separated"><label class="staff-select">Estado<select class="status-select"><option value="vigente">Vigente</option><option value="prestado">Prestado</option><option value="perdido">Perdido</option><option value="baja">Baja</option></select></label><button type="button" class="action-button status-save">Cambiar estado</button></div>`);
    let objects = [];
    const objectSelect = heritage.querySelector(".record-select");
    const objectForm = heritage.querySelector("form");
    const showObject = () => {
      const item = objects.find((value) => String(value.id) === objectSelect.value);
      if (!item) return;
      for (const [name, value] of Object.entries({ name: item.name, type: item.type, year: item.year_built, century: item.century, material: item.material, conservation: item.conservation, location: item.location_in_church })) objectForm.elements[name].value = value ?? "";
      objectForm.elements.inahCatalogued.checked = item.inah_catalogued;
      heritage.querySelector(".status-select").value = item.status;
    };
    objectSelect.addEventListener("change", showObject);
    const loadObjects = async () => {
      objects = (await api(`/churches/${churchId()}/heritage`)).objects;
      fill(objectSelect, objects.map((item) => ({ id: item.id, label: `${item.name} (${item.status})` })), "Selecciona un objeto");
    };
    objectForm.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      if (!objectSelect.value) throw new Error("Selecciona un objeto.");
      const v = data(objectForm);
      if (Boolean(v.year) === Boolean(v.century)) throw new Error("Indica año o siglo, solo uno.");
      await api(`/churches/${churchId()}/heritage/${objectSelect.value}`, "PUT", {
        name: v.name, type: v.type, ...(v.year ? { year: Number(v.year) } : { century: Number(v.century) }),
        material: v.material, conservation: v.conservation, location: v.location, inahCatalogued: v.inahCatalogued === "on"
      });
      await loadObjects();
    }); });
    heritage.querySelector(".status-save").addEventListener("click", () => run(async () => {
      if (!objectSelect.value) throw new Error("Selecciona un objeto.");
      await api(`/churches/${churchId()}/heritage/${objectSelect.value}/status`, "PATCH", { status: heritage.querySelector(".status-select").value });
      await loadObjects();
    }, "Estado patrimonial actualizado."));
    loaders.push(loadObjects);

    for (const kind of ["services", "talks"]) {
      const isService = kind === "services";
      const box = make(isService ? "Editar servicios" : "Editar pláticas", `<label class="staff-select">Registro<select class="record-select"></select></label>
        <form class="staff-form separated">${isService
          ? `<label>Nombre<input name="name" required></label><label>Requisitos<input name="requirements" required></label><label>Duración en minutos<input name="durationMinutes" type="number" min="1" required></label><label>Tipo de costo<select name="priceKind"><option value="fijo">Fijo</option><option value="gratuito">Gratuito</option><option value="donativo">Donativo</option></select></label><label>Precio fijo<input name="price" placeholder="0.00"></label><label>Horarios<input name="scheduleText" required></label><label><input name="appointmentRequired" type="checkbox"> Requiere cita</label>`
          : `<label>Tipo<input name="type" required></label><label>Días (0 a 6, separados por coma)<input name="weekdays" required></label><label>Hora<input name="localTime" type="time" required></label><label>Sesiones<input name="sessions" type="number" min="1" required></label><label>Precio<input name="price" placeholder="0.00"></label><label>Cupo<input name="capacity" type="number" min="1" required></label><label>Lugar<input name="place" required></label><label>Responsable<input name="instructor" required></label>`}
          <button type="submit">Guardar cambios</button></form><button type="button" class="action-button toggle-active">Activar o desactivar</button>`);
      let records = [];
      const select = box.querySelector(".record-select");
      const edit = box.querySelector("form");
      const display = () => {
        const item = records.find((value) => String(value.id) === select.value);
        if (!item) return;
        const mapping = isService
          ? { name: item.name, requirements: item.requirements, durationMinutes: item.duration_minutes, priceKind: item.price_kind, price: item.price_cents == null ? "" : (Number(item.price_cents) / 100).toFixed(2), scheduleText: item.schedule_text }
          : { type: item.type, weekdays: item.weekdays.join(","), localTime: item.local_time.slice(0, 5), sessions: item.sessions, price: (Number(item.price_cents) / 100).toFixed(2), capacity: item.capacity, place: item.place, instructor: item.instructor };
        for (const [name, value] of Object.entries(mapping)) edit.elements[name].value = value ?? "";
        if (isService) edit.elements.appointmentRequired.checked = item.appointment_required;
        box.querySelector(".toggle-active").textContent = item.active ? "Desactivar" : "Reactivar";
      };
      select.addEventListener("change", display);
      const loadRecords = async () => {
        records = await api(`/churches/${churchId()}/${kind}/manage`);
        fill(select, records.map((item) => ({ id: item.id, label: `${isService ? item.name : item.type} (${item.active ? "activo" : "inactivo"})` })), "Selecciona un registro");
      };
      edit.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
        if (!select.value) throw new Error("Selecciona un registro.");
        const v = data(edit);
        const body = isService
          ? { name: v.name, requirements: v.requirements, durationMinutes: Number(v.durationMinutes), appointmentRequired: v.appointmentRequired === "on", priceKind: v.priceKind, ...(v.price ? { price: v.price } : {}), scheduleText: v.scheduleText }
          : { type: v.type, weekdays: v.weekdays.split(",").map((day) => Number(day.trim())), localTime: v.localTime, sessions: Number(v.sessions), ...(v.price ? { price: v.price } : {}), capacity: Number(v.capacity), place: v.place, instructor: v.instructor };
        await api(`/churches/${churchId()}/${kind}/${select.value}`, "PUT", body);
        await loadRecords();
      }); });
      box.querySelector(".toggle-active").addEventListener("click", () => run(async () => {
        const item = records.find((value) => String(value.id) === select.value);
        if (!item) throw new Error("Selecciona un registro.");
        await api(`/churches/${churchId()}/${kind}/${item.id}/active`, "PATCH", { active: !item.active });
        await loadRecords();
      }, "Disponibilidad actualizada."));
      loaders.push(loadRecords);
    }
  }

  if (role === "coordinacion") {
    const users = make("Usuarios y permisos", `<p>Asigna una o varias iglesias a cada administrador o tesorero.</p>
      <form class="staff-form create-user"><label>Nombre<input name="name" required></label><label>Correo<input name="email" type="email" required></label><label>Contraseña inicial (mínimo 10 caracteres)<input name="password" type="password" minlength="10" required></label><label>Rol<select name="role"><option value="administrador_iglesia">Administrador</option><option value="tesorero">Tesorero</option><option value="coordinacion">Coordinación</option></select></label><label>Iglesias<select name="churchIds" multiple size="5"></select></label><button type="submit">Crear usuario</button></form>
      <div class="separated"><label class="staff-select">Usuario existente<select class="record-select"></select></label><form class="staff-form edit-user"><label>Nombre<input name="name" required></label><label>Rol<select name="role"><option value="administrador_iglesia">Administrador</option><option value="tesorero">Tesorero</option><option value="coordinacion">Coordinación</option></select></label><label>Iglesias<select name="churchIds" multiple size="5"></select></label><label><input name="active" type="checkbox"> Activo</label><button type="submit">Guardar permisos</button></form><form class="staff-form separated reset-user"><label>Nueva contraseña<input name="password" type="password" minlength="10" required></label><button type="submit">Restablecer contraseña</button></form></div>`);
    let people = [];
    const userSelect = users.querySelector(".record-select");
    const createForm = users.querySelector(".create-user");
    const editForm = users.querySelector(".edit-user");
    const selectChurches = (select, ids) => { for (const item of select.options) item.selected = ids.map(String).includes(item.value); };
    const selectedChurchIds = (form) => [...form.elements.churchIds.selectedOptions].map((item) => Number(item.value));
    const loadPeople = async () => {
      const [userRows, churchRows] = await Promise.all([api("/users"), api("/me/churches")]);
      people = userRows;
      const choices = churchRows.map((item) => option(item.id, item.name));
      for (const select of users.querySelectorAll("select[name=churchIds]")) select.replaceChildren(...choices.map((item) => option(item.value, item.textContent)));
      fill(userSelect, people.map((item) => ({ id: item.id, label: `${item.name} · ${item.role} ${item.active ? "" : "(inactivo)"}` })), "Selecciona un usuario");
    };
    userSelect.addEventListener("change", () => {
      const person = people.find((item) => String(item.id) === userSelect.value);
      if (!person) return;
      editForm.elements.name.value = person.name;
      editForm.elements.role.value = person.role;
      editForm.elements.active.checked = person.active;
      selectChurches(editForm.elements.churchIds, person.church_ids || []);
    });
    createForm.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      const v = data(createForm);
      await api("/users", "POST", { name: v.name, email: v.email, password: v.password, role: v.role, churchIds: selectedChurchIds(createForm) });
      createForm.reset(); await loadPeople();
    }, "Usuario creado."); });
    editForm.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      if (!userSelect.value) throw new Error("Selecciona un usuario.");
      const v = data(editForm);
      await api(`/users/${userSelect.value}`, "PUT", { name: v.name, role: v.role, active: v.active === "on", churchIds: selectedChurchIds(editForm) });
      await loadPeople();
    }, "Permisos actualizados."); });
    users.querySelector(".reset-user").addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      if (!userSelect.value) throw new Error("Selecciona un usuario.");
      await api(`/users/${userSelect.value}/password`, "PUT", { password: data(event.currentTarget).password });
      event.currentTarget.reset();
    }, "Contraseña restablecida."); });
    loaders.push(loadPeople);

    const criteria = make("Criterios patrimoniales", `<p>Publica una nueva versión. Los campos del cálculo se editan en el objeto de criterios y quedan versionados.</p><form class="staff-form"><label>Versión<input name="version" required></label><label>Año de referencia<input name="referenceYear" type="number" min="1900" max="2200" required></label><label>Criterios JSON<textarea name="config" rows="14" required></textarea></label><button type="submit">Publicar criterios</button></form>`);
    const criteriaForm = criteria.querySelector("form");
    const loadCriteria = async () => {
      const current = await api("/heritage-criteria");
      criteriaForm.elements.version.value = `${current.version}-nuevo`;
      criteriaForm.elements.referenceYear.value = current.reference_year;
      criteriaForm.elements.config.value = JSON.stringify(current.config, null, 2);
    };
    criteriaForm.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      const v = data(criteriaForm);
      await api("/heritage-criteria", "PUT", { version: v.version, referenceYear: Number(v.referenceYear), config: JSON.parse(v.config) });
      await loadCriteria();
    }, "Nueva versión de criterios publicada."); });
    loaders.push(loadCriteria);

    const comparison = make("Comparar diezmos por territorio", `<form class="staff-form"><label>Desde<input name="from" type="date" required></label><label>Hasta<input name="to" type="date" required></label><label>Estado (clave INEGI, opcional)<input name="state" pattern="[0-9]{2}"></label><label>Municipio (clave INEGI, opcional)<input name="municipality" pattern="[0-9]{5}"></label><button type="submit">Comparar</button></form><div class="comparison-result"></div>`);
    comparison.querySelector("form").addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(data(event.currentTarget))) if (value) params.set(key, value);
      const report = await api(`/tithes/comparison?${params}`);
      const output = comparison.querySelector(".comparison-result");
      output.replaceChildren(...report.items.map((item) => {
        const line = document.createElement("p");
        line.textContent = `${item.churchName}: $${item.totalPesos} MXN (${item.count} misas)`;
        return line;
      }));
    }, "Comparación cargada."); });
  }

  if (role === "tesorero") {
    const correction = make("Corregir diezmo", `<p>Cada corrección conserva monto anterior, autor, fecha y motivo.</p><form class="staff-form"><label>Diezmo<select name="id" required></select></label><label>Nuevo monto en pesos<input name="amount" pattern="[0-9]+(\\.[0-9]{1,2})?" required></label><label>Motivo<input name="reason" minlength="3" required></label><button type="submit">Guardar corrección</button></form>`);
    const form = correction.querySelector("form");
    const loadTithes = async () => {
      const rows = await api(`/churches/${churchId()}/tithes`);
      fill(form.elements.id, rows.map((item) => ({ id: item.id, label: `${item.local_date.slice(0, 10)} · ${item.priest_name} · $${(Number(item.amount_cents) / 100).toFixed(2)}` })), "Selecciona un diezmo");
    };
    form.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      const v = data(form);
      await api(`/churches/${churchId()}/tithes/${v.id}`, "PUT", { amount: v.amount, reason: v.reason });
      form.reset(); await loadTithes();
    }, "Diezmo corregido y auditado."); });
    loaders.push(loadTithes);
  }

  if (role !== "tesorero") {
    const units = make("Inventario de espacios", `<form class="staff-form"><label>Tipo<select name="spaceTypeId" required></select></label><label>Código interno de unidad<input name="code" maxlength="60" required></label><button type="submit">Registrar unidad</button></form><form class="staff-form separated assign-unit"><label>Solicitud aceptada<select name="requestId" required></select></label><label>Unidad disponible<select name="unitId" required></select></label><button type="submit">Asignar unidad</button></form><div class="unit-list"></div>`);
    const createForm = units.querySelector("form");
    const assignForm = units.querySelector(".assign-unit");
    const loadUnits = async () => {
      const [types, requests, rows] = await Promise.all([
        api(`/churches/${churchId()}/space-types`), api(`/churches/${churchId()}/space-requests`), api(`/churches/${churchId()}/space-units`)
      ]);
      fill(createForm.elements.spaceTypeId, types.map((item) => ({ id: item.id, label: item.type })), "Selecciona tipo");
      fill(assignForm.elements.requestId, requests.filter((item) => item.status === "aceptada" && !rows.some((unit) => String(unit.assigned_request_id) === String(item.id))).map((item) => ({ id: item.id, label: `${item.folio} · ${item.applicant_name}` })), "Selecciona solicitud");
      fill(assignForm.elements.unitId, rows.filter((item) => item.status === "disponible").map((item) => ({ id: item.id, label: `${item.code} · ${item.type}` })), "Selecciona unidad");
      const listing = units.querySelector(".unit-list");
      listing.replaceChildren(...rows.map((item) => {
        const line = document.createElement("p");
        line.textContent = `${item.code} · ${item.type} · ${item.status}`;
        return line;
      }));
    };
    createForm.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      const v = data(createForm);
      await api(`/churches/${churchId()}/space-units`, "POST", { spaceTypeId: Number(v.spaceTypeId), code: v.code });
      createForm.reset(); await loadUnits();
    }, "Unidad registrada."); });
    assignForm.addEventListener("submit", (event) => { event.preventDefault(); run(async () => {
      const v = data(assignForm);
      await api(`/churches/${churchId()}/space-requests/${v.requestId}/assign`, "POST", { unitId: Number(v.unitId) });
      await loadUnits();
    }, "Unidad asignada."); });
    loaders.push(loadUnits);
  }

  return {
    refresh: async () => {
      if (!churchId()) return;
      for (const load of loaders) try { await load(); } catch (error) { status(error.message); }
    },
    dispose: () => panels.forEach((panel) => panel.remove())
  };
}
