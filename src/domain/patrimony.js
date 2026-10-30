export const defaultCriteria = Object.freeze({
  ageBands: [
    { minYears: 300, points: 10 },
    { minYears: 200, points: 7 },
    { minYears: 100, points: 4 },
    { minYears: 50, points: 2 },
    { minYears: 0, points: 1 }
  ],
  multipliersTenths: {
    imagen: 15,
    retablo: 13,
    pintura: 13,
    mural: 13,
    organo: 12,
    piano: 12,
    orfebreria: 10,
    mobiliario_liturgico: 10,
    documento: 10,
    otro: 8
  },
  inahBonusTenths: 50,
  distinctionBands: [
    { minTenths: 400, name: "Patrimonio sobresaliente" },
    { minTenths: 200, name: "Alto valor patrimonial" },
    { minTenths: 80, name: "Valor patrimonial" }
  ]
});

export function representativeYear(object) {
  if (Number.isInteger(object.year)) return object.year;
  if (Number.isInteger(object.century) && object.century > 0) return object.century * 100 - 50;
  throw new Error("El objeto necesita año o siglo válido");
}

export function objectScoreTenths(object, referenceYear, criteria = defaultCriteria) {
  if (object.status !== "vigente") return 0;
  const age = referenceYear - representativeYear(object);
  if (!Number.isInteger(referenceYear) || age < 0) throw new Error("Fecha patrimonial inválida");
  const band = criteria.ageBands.find((entry) => age >= entry.minYears);
  if (!band) throw new Error("No existe tramo de antigüedad");
  const multiplier = criteria.multipliersTenths[object.type] ?? criteria.multipliersTenths.otro;
  return band.points * multiplier + (object.inahCatalogued ? criteria.inahBonusTenths : 0);
}

export function churchIndex(objects, referenceYear, criteria = defaultCriteria) {
  const tenths = objects.reduce((sum, object) => sum + objectScoreTenths(object, referenceYear, criteria), 0);
  const distinction = criteria.distinctionBands.find((band) => tenths >= band.minTenths)?.name ?? null;
  return { points: tenths / 10, distinction, registeredObjects: objects.length };
}
