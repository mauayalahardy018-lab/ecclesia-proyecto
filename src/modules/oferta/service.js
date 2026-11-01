import { parseCents } from "../../domain/money.js";
import { badRequest, notFound } from "../../lib/errors.js";
import * as repository from "./repository.js";

export function addService(churchId, input) {
  if (input.priceKind === "fijo" && input.price == null)
    throw badRequest("El servicio de precio fijo necesita importe");
  if (input.priceKind !== "fijo" && input.price != null) throw badRequest("Gratuito o donativo no tiene precio fijo");
  return repository.addService(churchId, {
    ...input,
    priceCents: input.priceKind === "fijo" ? parseCents(input.price).toString() : null
  });
}
export function addTalk(churchId, input) {
  return repository.addTalk(churchId, { ...input, priceCents: parseCents(input.price || "0").toString() });
}
export async function updateService(churchId, id, input) {
  if (input.priceKind === "fijo" && input.price == null)
    throw badRequest("El servicio de precio fijo necesita importe");
  if (input.priceKind !== "fijo" && input.price != null) throw badRequest("Gratuito o donativo no tiene precio fijo");
  const updated = await repository.updateService(churchId, id, {
    ...input,
    priceCents: input.priceKind === "fijo" ? parseCents(input.price).toString() : null
  });
  if (!updated) throw notFound();
  return updated;
}
export async function updateTalk(churchId, id, input) {
  const updated = await repository.updateTalk(churchId, id, {
    ...input,
    priceCents: parseCents(input.price || "0").toString()
  });
  if (!updated) throw notFound();
  return updated;
}
