import { hashPassword, signToken, verifyPassword } from "../../infrastructure/auth/access.js";
import { AppError, conflict, notFound } from "../../lib/errors.js";
import * as repository from "./repository.js";

function validateAssignments(input) {
  if (input.role !== "coordinacion" && input.churchIds.length === 0)
    throw conflict("Un usuario local necesita al menos una iglesia asignada");
}

export async function login(input) {
  const user = await repository.byEmail(input.email);
  if (!user || !(await verifyPassword(input.password, user.password_hash)))
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales inválidas");
  const safe = { ...user };
  delete safe.password_hash;
  return { token: signToken(user), expiresInSeconds: 7200, user: safe };
}
export const churchesFor = (user) => repository.churchesFor(user);
export const listUsers = () => repository.list();
export async function createUser(input) {
  validateAssignments(input);
  return repository.create(input, await hashPassword(input.password));
}
export async function updateUser(id, input) {
  validateAssignments(input);
  const updated = await repository.update(id, input);
  if (!updated) throw notFound();
  if (updated.lastCoordinator) throw conflict("No se puede desactivar al último coordinador activo");
  return updated;
}
export async function resetPassword(id, password) {
  const updated = await repository.setPassword(id, await hashPassword(password));
  if (!updated) throw notFound();
  return updated;
}
