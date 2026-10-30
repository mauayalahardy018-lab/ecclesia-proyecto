import { DateTime } from "luxon";
import { priestHasConflictAcrossZones } from "../../domain/schedules.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import * as repository from "./repository.js";

export async function addSchedule(churchId, input) {
  const timezone = await repository.churchTimezone(churchId);
  if (!timezone) throw notFound();
  if (!(await repository.assigned(churchId, input.priestId)))
    throw badRequest("El sacerdote debe estar asignado a la iglesia");
  return repository.withPriestLock(input.priestId, async (client) => {
    const existing = await repository.priestSchedules(input.priestId, client);
    const candidate = { ...input, timezone };
    if (priestHasConflictAcrossZones(candidate, existing, new Date().toISOString().slice(0, 10)))
      throw conflict("El sacerdote ya tiene una misa en ese horario");
    return repository.createSchedule(churchId, input, client);
  });
}

export async function celebrate(churchId, input, actorId) {
  const schedule = await repository.schedule(input.scheduleId);
  if (!schedule || Number(schedule.church_id) !== churchId) throw notFound();
  const local = DateTime.fromISO(`${input.localDate}T${String(schedule.local_time).slice(0, 5)}`, {
    zone: schedule.timezone
  });
  if (!local.isValid || local.weekday % 7 !== schedule.weekday)
    throw badRequest("La fecha no corresponde al horario semanal");
  if (input.actualPriestId !== Number(schedule.priest_id) && !input.substitutionReason?.trim())
    throw badRequest("Una sustitución necesita motivo");
  const end = local.plus({ minutes: schedule.duration_minutes }).toISO();
  return repository.withPriestLock(input.actualPriestId, async (client) => {
    if (await repository.priestCelebrationConflict(input.actualPriestId, local.toISO(), end, client))
      throw conflict("El oficiante ya tiene una misa celebrada a esa hora");
    return repository.createCelebration(
      {
        churchId,
        scheduleId: input.scheduleId,
        localDate: input.localDate,
        startsAt: local.toISO(),
        plannedPriestId: schedule.priest_id,
        actualPriestId: input.actualPriestId,
        substitutionReason: input.substitutionReason || null,
        changedBy: input.actualPriestId !== Number(schedule.priest_id) ? actorId : null
      },
      client
    );
  });
}
