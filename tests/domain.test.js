import { describe, it, expect } from "vitest";
import { churchIndex, representativeYear } from "../src/domain/patrimony.js";
import { priestHasConflict, priestHasConflictAcrossZones, weeklySchedulesOverlap } from "../src/domain/schedules.js";
import { parseCents, centsToPesos } from "../src/domain/money.js";
import { canTransition, quoteExpiry, transitionRequest } from "../src/domain/spaces.js";

describe("índice patrimonial", () => {
  it("reproduce exactamente el ejemplo 35.5 del caso", () => {
    const objects = [
      { type: "imagen", year: 1720, status: "vigente", inahCatalogued: true },
      { type: "retablo", century: 18, status: "vigente" },
      { type: "orfebreria", year: 1890, status: "vigente" },
      { type: "piano", year: 1950, status: "vigente" }
    ];
    expect(churchIndex(objects, 2026)).toEqual({
      points: 35.5,
      distinction: "Alto valor patrimonial",
      registeredObjects: 4
    });
    expect(representativeYear(objects[1])).toBe(1750);
  });
  it("excluye objetos no vigentes", () => {
    expect(churchIndex([{ type: "imagen", year: 1700, status: "prestado" }], 2026).points).toBe(0);
  });
});

describe("agendas", () => {
  it("rechaza misa traslapada del mismo sacerdote", () => {
    expect(
      priestHasConflict({ priestId: 1, weekday: 0, localTime: "10:30" }, [
        { priestId: 1, weekday: 0, localTime: "10:00" }
      ])
    ).toBe(true);
    expect(
      priestHasConflict({ priestId: 2, weekday: 0, localTime: "10:30" }, [
        { priestId: 1, weekday: 0, localTime: "10:00" }
      ])
    ).toBe(false);
    expect(
      priestHasConflict({ priestId: 1, weekday: 0, localTime: "10:30" }, [
        { priestId: "1", weekday: 0, localTime: "10:00" }
      ])
    ).toBe(true);
  });
  it("detecta traslape que cruza el fin de semana", () => {
    expect(weeklySchedulesOverlap({ weekday: 6, localTime: "23:30" }, { weekday: 0, localTime: "00:15" })).toBe(true);
  });
  it("compara instantes de zonas horarias distintas", () => {
    const proposed = { priestId: 1, weekday: 0, localTime: "09:00", timezone: "America/Mexico_City" };
    const existing = { priestId: 1, weekday: 0, localTime: "08:00", timezone: "America/Tijuana" };
    expect(priestHasConflictAcrossZones(proposed, [existing], "2026-10-30")).toBe(true);
    expect(priestHasConflictAcrossZones(proposed, [{ ...existing, localTime: "06:00" }], "2026-10-30")).toBe(false);
  });
});

describe("dinero", () => {
  it("mantiene centavos exactos", () => {
    expect(parseCents("123.45")).toBe(12345n);
    expect(centsToPesos(12345n)).toBe("123.45");
    expect(() => parseCents("0.001")).toThrow();
  });
});

describe("solicitudes de espacio", () => {
  it("permite solo las transiciones definidas", () => {
    expect(canTransition("solicitada", "en_revision")).toBe(true);
    expect(canTransition("solicitada", "aceptada")).toBe(false);
    expect(canTransition("desconocida", "cotizada")).toBe(false);
  });
  it("vence la cotización a los 15 días y prohíbe cancelar tras aceptar", () => {
    const expires = quoteExpiry("2026-10-01T12:00:00.000Z");
    expect(expires).toBe("2026-10-16T12:00:00.000Z");
    const accepted = transitionRequest(
      { status: "cotizada", quoteExpiresAt: expires },
      "aceptada",
      new Date("2026-10-15T12:00:00Z")
    );
    expect(() => transitionRequest(accepted, "cancelada")).toThrow();
    expect(() =>
      transitionRequest({ status: "cotizada", quoteExpiresAt: expires }, "aceptada", new Date(expires))
    ).toThrow();
  });
});
