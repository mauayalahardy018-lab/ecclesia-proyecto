import { DateTime } from "luxon";

const weekMinutes = 7 * 24 * 60;

export function timeToMinutes(time) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Hora local inválida");
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function pieces(schedule) {
  const { weekday, localTime, durationMinutes = 60 } = schedule;
  if (
    !Number.isInteger(weekday) ||
    weekday < 0 ||
    weekday > 6 ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 1440
  )
    throw new Error("Horario inválido");
  const start = weekday * 1440 + timeToMinutes(localTime);
  const end = start + durationMinutes;
  return end <= weekMinutes
    ? [[start, end]]
    : [
        [start, weekMinutes],
        [0, end - weekMinutes]
      ];
}

export function weeklySchedulesOverlap(a, b) {
  return pieces(a).some(([as, ae]) => pieces(b).some(([bs, be]) => as < be && bs < ae));
}

export function priestHasConflict(candidate, schedules) {
  return schedules.some(
    (existing) =>
      String(existing.priestId) === String(candidate.priestId) &&
      (candidate.id == null || existing.id !== candidate.id) &&
      weeklySchedulesOverlap(candidate, existing)
  );
}

function occurrence(schedule, sunday) {
  const date = sunday.plus({ days: schedule.weekday });
  const [hour, minute] = schedule.localTime.slice(0, 5).split(":").map(Number);
  const start = DateTime.fromObject(
    { year: date.year, month: date.month, day: date.day, hour, minute },
    { zone: schedule.timezone }
  );
  if (!start.isValid || start.hour !== hour || start.minute !== minute)
    throw new Error("Horario local inexistente o zona inválida");
  return [start.toMillis(), start.plus({ minutes: schedule.durationMinutes || 60 }).toMillis()];
}

export function priestHasConflictAcrossZones(candidate, schedules, referenceDate, weeks = 54) {
  const reference = DateTime.fromISO(referenceDate, { zone: "UTC" });
  if (!reference.isValid) throw new Error("Fecha de referencia inválida");
  const sunday = reference.minus({ days: reference.weekday % 7 }).startOf("day");
  return schedules.some((existing) => {
    if (
      String(existing.priestId) !== String(candidate.priestId) ||
      (candidate.id != null && String(existing.id) === String(candidate.id))
    )
      return false;
    for (let week = 0; week < weeks; week++) {
      const day = sunday.plus({ weeks: week });
      const [as, ae] = occurrence(candidate, day);
      const [bs, be] = occurrence(existing, day);
      if (as < be && bs < ae) return true;
    }
    return false;
  });
}
