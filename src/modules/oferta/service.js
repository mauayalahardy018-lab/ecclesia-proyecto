import { parseCents } from "../../domain/money.js";
import { badRequest } from "../../lib/errors.js";
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
