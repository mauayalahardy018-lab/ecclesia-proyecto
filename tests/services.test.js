import { beforeEach, describe, expect, it, vi } from "vitest";
import * as churches from "../src/modules/iglesias/service.js";
import * as churchesRepo from "../src/modules/iglesias/repository.js";
import * as offer from "../src/modules/oferta/service.js";
import * as offerRepo from "../src/modules/oferta/repository.js";
import * as masses from "../src/modules/misas/service.js";
import * as massesRepo from "../src/modules/misas/repository.js";

vi.mock("../src/modules/iglesias/repository.js", () => ({
  listChurches: vi.fn(),
  findChurch: vi.fn(),
  createChurch: vi.fn(),
  updateChurch: vi.fn(),
  closeChurch: vi.fn(),
  reopenChurch: vi.fn()
}));
vi.mock("../src/modules/oferta/repository.js", () => ({
  addService: vi.fn(),
  addTalk: vi.fn(),
  updateService: vi.fn(),
  updateTalk: vi.fn()
}));
vi.mock("../src/modules/misas/repository.js", () => ({
  churchTimezone: vi.fn(),
  assigned: vi.fn(),
  withPriestLock: vi.fn(),
  priestSchedules: vi.fn(),
  createSchedule: vi.fn(),
  churchSchedules: vi.fn(),
  schedule: vi.fn(),
  priestCelebrationConflict: vi.fn(),
  createCelebration: vi.fn()
}));

beforeEach(() => vi.resetAllMocks());

describe("servicio de iglesias", () => {
  it("rechaza claves incongruentes y acepta una jerarquía geográfica válida", async () => {
    await expect(
      churches.create({ stateCode: "31", municipalityCode: "21001", localityCode: "210010001" })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      churches.create({ stateCode: "31", municipalityCode: "31001", localityCode: "310020001" })
    ).rejects.toMatchObject({ status: 400 });
    churchesRepo.createChurch.mockResolvedValue({ id: 5 });
    await expect(
      churches.create({ stateCode: "31", municipalityCode: "31001", localityCode: "310010001" })
    ).resolves.toEqual({ id: 5 });
  });
  it("devuelve 404 al consultar o cambiar un registro inexistente", async () => {
    churchesRepo.findChurch.mockResolvedValue(null);
    await expect(churches.detail(999)).rejects.toMatchObject({ status: 404 });
    await expect(churches.manageDetail(999)).rejects.toMatchObject({ status: 404 });
    churchesRepo.updateChurch.mockResolvedValue(null);
    churchesRepo.closeChurch.mockResolvedValue(null);
    churchesRepo.reopenChurch.mockResolvedValue(null);
    await expect(churches.update(999, {})).rejects.toMatchObject({ status: 404 });
    await expect(churches.close(999)).rejects.toMatchObject({ status: 404 });
    await expect(churches.reopen(999)).rejects.toMatchObject({ status: 404 });
  });
  it("permite gestionar una iglesia cerrada y transmite los cambios", async () => {
    churchesRepo.findChurch.mockResolvedValue({ id: 1, active: false });
    churchesRepo.updateChurch.mockResolvedValue({ id: 1, name: "Nueva" });
    churchesRepo.closeChurch.mockResolvedValue({ id: 1, active: false });
    churchesRepo.reopenChurch.mockResolvedValue({ id: 1, active: true });
    await expect(churches.manageDetail(1)).resolves.toMatchObject({ active: false });
    expect(churchesRepo.findChurch).toHaveBeenCalledWith(1, true);
    await expect(churches.update(1, { name: "Nueva" })).resolves.toMatchObject({ name: "Nueva" });
    await expect(churches.close(1)).resolves.toMatchObject({ active: false });
    await expect(churches.reopen(1)).resolves.toMatchObject({ active: true });
  });
});

describe("servicio de oferta", () => {
  it("exige precio solo cuando el servicio es de importe fijo", async () => {
    expect(() => offer.addService(1, { priceKind: "fijo" })).toThrow();
    expect(() => offer.addService(1, { priceKind: "gratuito", price: "1.00" })).toThrow();
    offerRepo.addService.mockResolvedValue({ id: 1 });
    await expect(offer.addService(1, { priceKind: "fijo", price: "12.34" })).resolves.toEqual({ id: 1 });
    expect(offerRepo.addService).toHaveBeenCalledWith(1, expect.objectContaining({ priceCents: "1234" }));
    await offer.addService(1, { priceKind: "donativo" });
    expect(offerRepo.addService).toHaveBeenLastCalledWith(1, expect.objectContaining({ priceCents: null }));
  });
  it("convierte el precio de la plática y rechaza ediciones inexistentes", async () => {
    offerRepo.addTalk.mockResolvedValue({ id: 2 });
    await offer.addTalk(1, { price: "0.50" });
    expect(offerRepo.addTalk).toHaveBeenCalledWith(1, expect.objectContaining({ priceCents: "50" }));
    offerRepo.updateService.mockResolvedValue(null);
    offerRepo.updateTalk.mockResolvedValue(null);
    await expect(offer.updateService(1, 9, { priceKind: "gratuito" })).rejects.toMatchObject({ status: 404 });
    await expect(offer.updateTalk(1, 9, { price: "0" })).rejects.toMatchObject({ status: 404 });
    await expect(offer.updateService(1, 9, { priceKind: "fijo" })).rejects.toMatchObject({ status: 400 });
    await expect(offer.updateService(1, 9, { priceKind: "donativo", price: "1" })).rejects.toMatchObject({
      status: 400
    });
  });
  it("actualiza servicio y plática válidos", async () => {
    offerRepo.updateService.mockResolvedValue({ id: 2 });
    offerRepo.updateTalk.mockResolvedValue({ id: 3 });
    await expect(offer.updateService(1, 2, { priceKind: "fijo", price: "3.25" })).resolves.toEqual({ id: 2 });
    expect(offerRepo.updateService).toHaveBeenCalledWith(1, 2, expect.objectContaining({ priceCents: "325" }));
    await expect(offer.updateTalk(1, 3, { price: "2.00" })).resolves.toEqual({ id: 3 });
  });
});

describe("servicio de misas", () => {
  it("impide horario sin iglesia o sacerdote asignado", async () => {
    massesRepo.churchTimezone.mockResolvedValueOnce(null).mockResolvedValue("America/Mexico_City");
    massesRepo.assigned.mockResolvedValue(false);
    await expect(masses.addSchedule(1, { priestId: 2 })).rejects.toMatchObject({ status: 404 });
    await expect(masses.addSchedule(1, { priestId: 2 })).rejects.toMatchObject({ status: 400 });
  });
  it("detecta el traslape y permite un horario libre", async () => {
    massesRepo.churchTimezone.mockResolvedValue("America/Mexico_City");
    massesRepo.assigned.mockResolvedValue(true);
    massesRepo.withPriestLock.mockImplementation((_id, callback) => callback({}));
    massesRepo.priestSchedules.mockResolvedValue([
      { priestId: 2, weekday: 0, localTime: "10:00", timezone: "America/Mexico_City" }
    ]);
    const payload = { priestId: 2, weekday: 0, localTime: "10:30" };
    await expect(masses.addSchedule(1, payload)).rejects.toMatchObject({ status: 409 });
    massesRepo.priestSchedules.mockResolvedValue([]);
    massesRepo.createSchedule.mockResolvedValue({ id: 7 });
    await expect(masses.addSchedule(1, payload)).resolves.toEqual({ id: 7 });
  });
  it("genera agenda o devuelve 404 si falta la iglesia", async () => {
    massesRepo.churchTimezone.mockResolvedValueOnce(null).mockResolvedValue("America/Mexico_City");
    await expect(masses.weeklyAgenda(1, "2026-10-30")).rejects.toMatchObject({ status: 404 });
    massesRepo.churchSchedules.mockResolvedValue([]);
    await expect(masses.weeklyAgenda(1, "2026-10-30")).resolves.toMatchObject({ items: [] });
  });
  it("valida la fecha, el motivo y el choque de una celebración", async () => {
    const schedule = {
      church_id: 1,
      priest_id: 2,
      local_time: "07:00",
      weekday: 5,
      timezone: "America/Mexico_City",
      duration_minutes: 60
    };
    massesRepo.schedule.mockResolvedValueOnce(null).mockResolvedValue(schedule);
    await expect(masses.celebrate(1, { scheduleId: 4 }, 1)).rejects.toMatchObject({ status: 404 });
    await expect(masses.celebrate(2, { scheduleId: 4 }, 1)).rejects.toMatchObject({ status: 404 });
    await expect(masses.celebrate(1, { scheduleId: 4, localDate: "2026-10-29" }, 1)).rejects.toMatchObject({
      status: 400
    });
    await expect(
      masses.celebrate(1, { scheduleId: 4, localDate: "2026-10-30", actualPriestId: 3 }, 1)
    ).rejects.toMatchObject({ status: 400 });
    massesRepo.withPriestLock.mockImplementation((_id, callback) => callback({}));
    massesRepo.priestCelebrationConflict.mockResolvedValueOnce(true).mockResolvedValue(false);
    await expect(
      masses.celebrate(1, { scheduleId: 4, localDate: "2026-10-30", actualPriestId: 2 }, 1)
    ).rejects.toMatchObject({ status: 409 });
    massesRepo.createCelebration.mockResolvedValue({ id: 8 });
    await expect(
      masses.celebrate(
        1,
        { scheduleId: 4, localDate: "2026-10-30", actualPriestId: 3, substitutionReason: "Enfermedad" },
        1
      )
    ).resolves.toEqual({ id: 8 });
    expect(massesRepo.createCelebration).toHaveBeenCalledWith(
      expect.objectContaining({ actualPriestId: 3, changedBy: 1 }),
      expect.anything()
    );
  });
});
