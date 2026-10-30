export class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, "INVALID_REQUEST", message, details);
export const forbidden = () => new AppError(403, "FORBIDDEN", "Acceso denegado");
export const notFound = () => new AppError(404, "NOT_FOUND", "No encontrado");
export const conflict = (message) => new AppError(409, "CONFLICT", message);

export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && "body" in error)
    return res.status(400).json({ codigo: "INVALID_JSON", mensaje: "JSON inválido", detalles: null });
  if (error.name === "ZodError")
    return res.status(400).json({ codigo: "VALIDATION_ERROR", mensaje: "Datos inválidos", detalles: error.issues });
  if (error.code === "23505")
    return res.status(409).json({ codigo: "CONFLICT", mensaje: "El registro ya existe", detalles: null });
  if (error.code === "23503")
    return res.status(400).json({ codigo: "INVALID_REFERENCE", mensaje: "Referencia inexistente", detalles: null });
  if (error.code === "22P02")
    return res.status(400).json({ codigo: "INVALID_REQUEST", mensaje: "Identificador inválido", detalles: null });
  if (error instanceof AppError)
    return res.status(error.status).json({ codigo: error.code, mensaje: error.message, detalles: error.details });
  console.error(error);
  return res.status(500).json({ codigo: "INTERNAL_ERROR", mensaje: "Error interno", detalles: null });
}

export const route = (work) => (req, res, next) => Promise.resolve(work(req, res)).catch(next);
