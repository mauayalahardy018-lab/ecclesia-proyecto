const transitions = {
  solicitada: ["en_revision", "cancelada"],
  en_revision: ["cotizada", "sin_disponibilidad", "cancelada"],
  cotizada: ["aceptada", "rechazada", "vencida", "cancelada"],
  aceptada: [],
  rechazada: [],
  vencida: [],
  sin_disponibilidad: [],
  cancelada: []
};

export function canTransition(from, to) {
  return Boolean(transitions[from]?.includes(to));
}

export function transitionRequest(request, to, at = new Date()) {
  if (!canTransition(request.status, to)) throw new Error(`No se permite pasar de ${request.status} a ${to}`);
  if (
    request.status === "cotizada" &&
    ["aceptada", "rechazada"].includes(to) &&
    at.getTime() >= Date.parse(request.quoteExpiresAt)
  )
    throw new Error("La cotización ya venció");
  return { ...request, status: to };
}

export function quoteExpiry(issuedAt) {
  return new Date(new Date(issuedAt).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
}
