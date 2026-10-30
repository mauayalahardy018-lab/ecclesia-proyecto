import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../db/pool.js";
import { AppError, forbidden } from "../../lib/errors.js";

export const hashPassword = (password) => bcrypt.hash(password, 12);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export function signToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres");
  return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "2h",
    issuer: "ecclesia"
  });
}

export async function authenticate(req, _res, next) {
  try {
    const token = /^Bearer (.+)$/i.exec(req.headers.authorization || "")?.[1];
    if (!token) throw new AppError(401, "UNAUTHENTICATED", "Inicia sesión");
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "ecclesia" });
    const result = await query("SELECT id,name,email,role FROM users WHERE id=$1 AND active=true", [decoded.sub]);
    if (!result.rowCount) throw new AppError(401, "UNAUTHENTICATED", "Sesión inválida");
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
      return next(new AppError(401, "UNAUTHENTICATED", "Sesión inválida"));
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => (roles.includes(req.user?.role) ? next() : next(forbidden()));
}

export async function requireChurch(req, churchId) {
  if (req.user?.role === "coordinacion") return;
  const result = await query("SELECT 1 FROM user_churches WHERE user_id=$1 AND church_id=$2", [req.user?.id, churchId]);
  if (!result.rowCount) throw forbidden();
}
