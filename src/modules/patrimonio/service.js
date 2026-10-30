import { churchIndex, defaultCriteria } from "../../domain/patrimony.js";
import { notFound } from "../../lib/errors.js";
import * as repository from "./repository.js";

const normalize = (row) => ({
  type: row.type,
  year: row.year_built,
  century: row.century,
  status: row.status,
  inahCatalogued: row.inah_catalogued
});

export async function indexForChurch(churchId) {
  const config = await repository.criteria();
  const objects = await repository.objectsForChurch(churchId);
  return {
    ...churchIndex(
      objects.map(normalize),
      config?.reference_year || new Date().getFullYear(),
      config?.config || defaultCriteria
    ),
    criteriaVersion: config?.version || "default"
  };
}

export async function ranking(filters) {
  const config = await repository.criteria();
  const referenceYear = config?.reference_year || new Date().getFullYear();
  const rules = config?.config || defaultCriteria;
  const candidates = await repository.rankingCandidates(filters);
  const matches = candidates.filter(({ objects }) =>
    !filters.objectType && filters.minAge == null
      ? true
      : objects.some(
          (object) =>
            object.status === "vigente" &&
            (!filters.objectType || object.type === filters.objectType) &&
            referenceYear - (object.year_built ?? object.century * 100 - 50) >= (filters.minAge || 0)
        )
  );
  const ordered = matches
    .map(({ church, objects }) => ({ ...church, ...churchIndex(objects.map(normalize), referenceYear, rules) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  const start = (filters.page - 1) * filters.limit;
  return {
    total: ordered.length,
    criteriaVersion: config?.version || "default",
    items: ordered.slice(start, start + filters.limit)
  };
}

export async function changeStatus(churchId, objectId, status) {
  const object = await repository.changeStatus(churchId, objectId, status);
  if (!object) throw notFound();
  return object;
}
