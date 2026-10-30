import { Router } from "express";
import { z } from "zod";
import { route } from "../../lib/errors.js";
import { authenticate, requireChurch, requireRole } from "../../infrastructure/auth/access.js";
import * as service from "./service.js";

const router = Router();
const amountInput = z.object({ amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/) });
const reportInput = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  groupBy: z.enum(["day", "week", "month", "schedule", "priest"]).default("day")
});

router.post(
  "/churches/:churchId/celebrations/:celebrationId/tithe",
  authenticate,
  requireRole("tesorero"),
  route(async (req, res) => {
    const churchId = Number(req.params.churchId);
    await requireChurch(req, churchId);
    const { amount } = amountInput.parse(req.body);
    res.status(201).json(await service.create(churchId, Number(req.params.celebrationId), amount, req.user.id));
  })
);
router.put(
  "/churches/:churchId/tithes/:id",
  authenticate,
  requireRole("tesorero"),
  route(async (req, res) => {
    const churchId = Number(req.params.churchId);
    await requireChurch(req, churchId);
    const { amount, reason } = amountInput.extend({ reason: z.string().min(3) }).parse(req.body);
    res.json(await service.correct(churchId, Number(req.params.id), amount, reason, req.user.id));
  })
);
router.get(
  "/churches/:churchId/tithes/report",
  authenticate,
  requireRole("tesorero", "coordinacion"),
  route(async (req, res) => {
    const churchId = Number(req.params.churchId);
    await requireChurch(req, churchId);
    res.json(await service.report(churchId, reportInput.parse(req.query)));
  })
);
export default router;
