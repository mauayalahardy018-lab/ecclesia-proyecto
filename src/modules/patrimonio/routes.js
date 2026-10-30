import { Router } from "express";
import { z } from "zod";
import { route, notFound } from "../../lib/errors.js";
import { authenticate, requireChurch, requireRole } from "../../infrastructure/auth/access.js";
import * as repository from "./repository.js";
import * as service from "./service.js";
import { ensureActive } from "../iglesias/service.js";

const router = Router();
const objectInput = z
  .object({
    name: z.string().trim().min(2),
    type: z.enum([
      "imagen",
      "retablo",
      "pintura",
      "mural",
      "organo",
      "piano",
      "orfebreria",
      "mobiliario_liturgico",
      "documento",
      "otro"
    ]),
    year: z.number().int().min(1).max(2100).optional(),
    century: z.number().int().min(1).max(21).optional(),
    material: z.string().min(1),
    conservation: z.string().min(1),
    location: z.string().min(1),
    inahCatalogued: z.boolean().default(false)
  })
  .refine((value) => (value.year == null) !== (value.century == null), { message: "Indica año o siglo, solo uno" });
const rankingFilters = z.object({
  state: z
    .string()
    .regex(/^\d{2}$/)
    .optional(),
  municipality: z
    .string()
    .regex(/^\d{5}$/)
    .optional(),
  locality: z
    .string()
    .regex(/^\d{9}$/)
    .optional(),
  objectType: z.string().optional(),
  minAge: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
const criteriaInput = z.object({
  version: z.string().min(2),
  referenceYear: z.number().int().min(1900).max(2200),
  config: z.object({
    ageBands: z.array(z.object({ minYears: z.number().int().min(0), points: z.number().int().min(0) })).min(1),
    multipliersTenths: z.record(z.string(), z.number().int().positive()),
    inahBonusTenths: z.number().int().min(0),
    distinctionBands: z.array(z.object({ minTenths: z.number().int().min(0), name: z.string().min(1) })).min(1)
  })
});

router.get(
  "/rankings",
  route(async (req, res) => res.json(await service.ranking(rankingFilters.parse(req.query))))
);
router.get(
  "/churches/:churchId/heritage",
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await ensureActive(id);
    res.json({ objects: await repository.objectsForChurch(id), index: await service.indexForChurch(id) });
  })
);
router.get(
  "/heritage-criteria",
  route(async (_req, res) => {
    const data = await repository.criteria();
    if (!data) throw notFound();
    res.json(data);
  })
);
router.put(
  "/heritage-criteria",
  authenticate,
  requireRole("coordinacion"),
  route(async (req, res) => res.json(await repository.setCriteria(criteriaInput.parse(req.body))))
);
router.post(
  "/churches/:churchId/heritage",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.status(201).json(await repository.addObject(id, objectInput.parse(req.body)));
  })
);
router.patch(
  "/churches/:churchId/heritage/:id/status",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const churchId = Number(req.params.churchId);
    await requireChurch(req, churchId);
    const { status } = z.object({ status: z.enum(["vigente", "perdido", "prestado", "baja"]) }).parse(req.body);
    res.json(await service.changeStatus(churchId, Number(req.params.id), status));
  })
);
export default router;
