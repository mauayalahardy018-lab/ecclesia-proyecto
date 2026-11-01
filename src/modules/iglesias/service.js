import * as repository from "./repository.js";
import { badRequest, notFound } from "../../lib/errors.js";

export const list = (filters) => repository.listChurches(filters);

export async function detail(id) {
  const church = await repository.findChurch(id);
  if (!church) throw notFound();
  return church;
}

export async function manageDetail(id) {
  const church = await repository.findChurch(id, true);
  if (!church) throw notFound();
  return church;
}

export async function ensureActive(id) {
  await detail(id);
}

export async function create(input) {
  if (!input.municipalityCode.startsWith(input.stateCode) || !input.localityCode.startsWith(input.municipalityCode))
    throw badRequest("Las claves geográficas no corresponden entre sí");
  return repository.createChurch(input);
}

export async function update(id, input) {
  const church = await repository.updateChurch(id, input);
  if (!church) throw notFound();
  return church;
}

export async function close(id) {
  const church = await repository.closeChurch(id);
  if (!church) throw notFound();
  return church;
}

export async function reopen(id) {
  const church = await repository.reopenChurch(id);
  if (!church) throw notFound();
  return church;
}
