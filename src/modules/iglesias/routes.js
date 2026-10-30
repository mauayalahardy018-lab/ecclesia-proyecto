import { Router } from "express";
import { z } from "zod";
import { route } from "../../lib/errors.js";
import { authenticate, requireChurch, requireRole } from "../../infrastructure/auth/access.js";
import * as service from "./service.js";

const router = Router();
const churchType = z.enum(["catedral", "basilica", "parroquia", "templo", "capilla", "santuario"]);
const filters = z.object({
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
  type: churchType.optional(),
  name: z.string().max(100).optional(),
  minCapacity: z.coerce.number().int().min(0).optional(),
  maxCapacity: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
const body = z.object({
  name: z.string().trim().min(2),
  type: churchType,
  stateCode: z.string().regex(/^\d{2}$/),
  municipalityCode: z.string().regex(/^\d{5}$/),
  localityCode: z.string().regex(/^\d{9}$/),
  address: z.string().trim().min(3),
  capacity: z.number().int().min(0).optional(),
  constructionYear: z.number().int().min(1).max(2100).optional(),
  phone: z.string().max(40).optional(),
  email: z.email().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().min(3).default("America/Mexico_City")
});
const editable = body.omit({ stateCode: true, municipalityCode: true, localityCode: true });

router.get(
  "/",
  route(async (req, res) => res.json(await service.list(filters.parse(req.query))))
);
router.get(
  "/:id",
  route(async (req, res) => res.json(await service.detail(Number(req.params.id))))
);
router.post(
  "/",
  authenticate,
  requireRole("coordinacion"),
  route(async (req, res) => res.status(201).json(await service.create(body.parse(req.body))))
);
router.put(
  "/:id",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.id);
    await requireChurch(req, id);
    res.json(await service.update(id, editable.parse(req.body)));
  })
);
router.delete(
  "/:id",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.id);
    await requireChurch(req, id);
    res.json(await service.close(id));
  })
);

router.patch(
  "/:id/reopen",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.id);
    await requireChurch(req, id);
    res.json(await service.reopen(id));
  })
);

export default router;
