import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { parseCents } from "../../domain/money.js";
import { quoteExpiry, transitionRequest } from "../../domain/spaces.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import * as repository from "./repository.js";

const publicRecord = (record) => {
  const safe = { ...record };
  delete safe.access_key_hash;
  return safe;
};

export async function submit(churchId, input) {
  if (!(await repository.churchActive(churchId)) || !(await repository.hasType(churchId, input.spaceTypeId)))
    throw notFound();
  const folio = `EC-${randomBytes(6).toString("hex").toUpperCase()}`;
  const accessKey = randomBytes(18).toString("base64url");
  const record = await repository.create(churchId, {
    ...input,
    folio,
    accessKeyHash: await bcrypt.hash(accessKey, 12)
  });
  return { ...record, accessKey };
}

export async function follow(folio, accessKey) {
  const record = await repository.byFolio(folio);
  if (!record || !accessKey || !(await bcrypt.compare(accessKey, record.access_key_hash))) throw notFound();
  if (record.status === "cotizada" && new Date(record.quote_expires_at).getTime() <= Date.now()) {
    const expired = await repository.transition(record, "vencida", null, "Venció a los 15 días");
    return publicRecord(expired || (await repository.byFolio(folio)));
  }
  return publicRecord(record);
}

export async function applicantAction(folio, accessKey, action) {
  const record = await follow(folio, accessKey);
  const next = { accept: "aceptada", reject: "rechazada", cancel: "cancelada" }[action];
  if (!next) throw badRequest("Acción inválida");
  try {
    transitionRequest({ status: record.status, quoteExpiresAt: record.quote_expires_at }, next);
  } catch (error) {
    throw conflict(error.message);
  }
  const changed = await repository.transition(record, next, null, `Acción del solicitante: ${action}`);
  if (!changed) throw conflict("La solicitud cambió; vuelve a consultarla");
  return publicRecord(changed);
}

export async function staffAction(churchId, requestId, action, input, userId) {
  const record = await repository.byId(churchId, requestId);
  if (!record) throw notFound();
  const next = { review: "en_revision", quote: "cotizada", unavailable: "sin_disponibilidad" }[action];
  if (!next) throw badRequest("Acción inválida");
  try {
    transitionRequest({ status: record.status, quoteExpiresAt: record.quote_expires_at }, next);
  } catch (error) {
    throw conflict(error.message);
  }
  let quote = null;
  if (next === "cotizada") {
    if (!input.amount || !input.conditions?.trim()) throw badRequest("Importe y condiciones son obligatorios");
    const issuedAt = new Date().toISOString();
    quote = {
      cents: parseCents(input.amount).toString(),
      conditions: input.conditions.trim(),
      issuedAt,
      expiresAt: quoteExpiry(issuedAt)
    };
  }
  const changed = await repository.transition(record, next, userId, input.note || null, quote);
  if (!changed) throw conflict("La solicitud cambió; vuelve a consultarla");
  return publicRecord(changed);
}
