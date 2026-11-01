import { Router } from "express";
import { z } from "zod";
import { route, notFound } from "../../lib/errors.js";
import { authenticate, requireChurch, requireRole } from "../../infrastructure/auth/access.js";
import * as repository from "./repository.js";
import * as service from "./service.js";
import { ensureActive } from "../iglesias/service.js";

const router = Router();
const scheduleInput = z.object({
  priestId: z.number().int().positive(),
  weekday: z.number().int().min(0).max(6),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(1).max(1440).default(60),
  kind: z.enum(["diaria", "dominical", "especial"]),
  language: z.string().min(2).default("español")
});
const celebrationInput = z.object({
  scheduleId: z.number().int().positive(),
  localDate: z.iso.date(),
  actualPriestId: z.number().int().positive(),
  substitutionReason: z.string().optional()
});

router.get(
  "/churches/:churchId/priests",
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await ensureActive(id);
    res.json(await repository.listChurchPriests(id));
  })
);
router.get(
  "/priests/:id/agenda",
  route(async (req, res) => res.json(await repository.priestSchedules(Number(req.params.id))))
);
router.get(
  "/churches/:churchId/masses",
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await ensureActive(id);
    res.json(await repository.churchSchedules(id));
  })
);
router.get(
  "/churches/:churchId/masses/week",
  route(async (req, res) => {
    const { from } = z.object({ from: z.iso.date() }).parse(req.query);
    res.json(await service.weeklyAgenda(Number(req.params.churchId), from));
  })
);
router.post(
  "/churches/:churchId/priests",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body);
    res.status(201).json(await repository.createPriest(id, name));
  })
);
router.post(
  "/churches/:churchId/priests/:priestId",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    const priest = await repository.assignPriest(id, Number(req.params.priestId));
    if (!priest) throw notFound();
    res.json(priest);
  })
);
router.post(
  "/churches/:churchId/masses",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.status(201).json(await service.addSchedule(id, scheduleInput.parse(req.body)));
  })
);
router.get(
  "/churches/:churchId/celebrations",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia", "tesorero"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.json(await repository.churchCelebrations(id));
  })
);
router.post(
  "/churches/:churchId/celebrations",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.status(201).json(await service.celebrate(id, celebrationInput.parse(req.body), req.user.id));
  })
);
export default router;
