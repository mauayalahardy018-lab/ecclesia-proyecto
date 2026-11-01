const panel = document.getElementById("gestion-panel");
const mount = document.getElementById("gestion-mount");
const loading = document.getElementById("gestion-loading");
let loaded = false;

async function showPanel() {
  document.body.classList.add("management-mode");
  panel.hidden = false;
  if (loaded) return;
  try {
    const response = await fetch("/gestion.html");
    if (!response.ok) throw new Error(`No se pudo cargar el panel (${response.status}).`);
    const documentView = new DOMParser().parseFromString(await response.text(), "text/html");
    const content = documentView.querySelector("main");
    if (!content) throw new Error("El panel de gestión no está disponible.");
    mount.innerHTML = content.innerHTML;
    await import("./gestion.js");
    loading.hidden = true;
    loaded = true;
  } catch (error) {
    loading.textContent = error.message;
  }
}

function route() {
  if (location.hash === "#gestion") {
    showPanel();
  } else {
    document.body.classList.remove("management-mode");
    panel.hidden = true;
  }
}

window.addEventListener("hashchange", route);
route();
