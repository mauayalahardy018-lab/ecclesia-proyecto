import { DateTime } from "luxon";
import { parseCents, centsToPesos } from "../../domain/money.js";
import { badRequest, notFound } from "../../lib/errors.js";
import * as repository from "./repository.js";

export async function create(churchId, celebrationId, amount, userId) {
  if (!(await repository.celebration(churchId, celebrationId))) throw notFound();
  return repository.createTithe(churchId, celebrationId, parseCents(amount).toString(), userId);
}
export async function correct(churchId, titheId, amount, reason, userId) {
  if (!reason?.trim()) throw badRequest("La corrección necesita motivo");
  const changed = await repository.changeTithe(churchId, titheId, parseCents(amount).toString(), userId, reason.trim());
  if (!changed) throw notFound();
  return { ...changed, history: await repository.changes(churchId, titheId) };
}
export async function report(churchId, filters) {
  const rows = await repository.reportRows(churchId, filters.from, filters.to);
  const total = rows.reduce((sum, row) => sum + BigInt(row.amount_cents), 0n);
  const grouped = new Map();
  for (const row of rows) {
    const day = DateTime.fromJSDate(new Date(row.local_date), { zone: "UTC" });
    const key =
      filters.groupBy === "week"
        ? `${day.weekYear}-W${String(day.weekNumber).padStart(2, "0")}`
        : filters.groupBy === "month"
          ? day.toFormat("yyyy-MM")
          : filters.groupBy === "schedule"
            ? String(row.schedule_id)
            : filters.groupBy === "priest"
              ? `${row.actual_priest_id}:${row.priest_name}`
              : day.toISODate();
    const bucket = grouped.get(key) || { key, totalCents: 0n, count: 0 };
    bucket.totalCents += BigInt(row.amount_cents);
    bucket.count++;
    grouped.set(key, bucket);
  }
  const order = [...rows].sort((a, b) =>
    BigInt(a.amount_cents) < BigInt(b.amount_cents) ? -1 : BigInt(a.amount_cents) > BigInt(b.amount_cents) ? 1 : 0
  );
  return {
    churchId,
    period: { from: filters.from, to: filters.to },
    count: rows.length,
    totalPesos: centsToPesos(total),
    averagePesos: rows.length
      ? centsToPesos((total + BigInt(Math.floor(rows.length / 2))) / BigInt(rows.length))
      : "0.00",
    lowest: order[0]
      ? { celebrationId: order[0].celebration_id, amountPesos: centsToPesos(order[0].amount_cents) }
      : null,
    highest: order.at(-1)
      ? { celebrationId: order.at(-1).celebration_id, amountPesos: centsToPesos(order.at(-1).amount_cents) }
      : null,
    groups: [...grouped.values()].map((bucket) => ({
      key: bucket.key,
      count: bucket.count,
      totalPesos: centsToPesos(bucket.totalCents)
    }))
  };
}
