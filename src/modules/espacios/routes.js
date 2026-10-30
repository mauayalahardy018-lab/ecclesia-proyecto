import { Router } from "express";
import { z } from "zod";
import { route } from "../../lib/errors.js";
import { authenticate, requireChurch, requireRole } from "../../infrastructure/auth/access.js";
import * as repository from "./repository.js";
import * as service from "./service.js";

const router = Router();
const money = z.string().regex(/^\d+(?:\.\d{1,2})?$/);
const requestInput = z
  .object({
    spaceTypeId: z.number().int().positive(),
    name: z.string().trim().min(2),
    email: z.email().optional(),
    phone: z.string().min(7).optional()
  })
  .refine((value) => value.email || value.phone, { message: "Se necesita correo o teléfono" });
const staffInput = z.object({
  amount: money.optional(),
  conditions: z.string().optional(),
  note: z.string().optional()
});

router.get(
  "/churches/:churchId/space-types",
  route(async (req, res) => res.json(await repository.publicTypes(Number(req.params.churchId))))
);
router.post(
  "/churches/:churchId/space-requests",
  route(async (req, res) =>
    res.status(201).json(await service.submit(Number(req.params.churchId), requestInput.parse(req.body)))
  )
);
router.get(
  "/space-requests/:folio",
  route(async (req, res) => res.json(await service.follow(req.params.folio, req.headers["x-access-key"])))
);
router.post(
  "/space-requests/:folio/:action",
  route(async (req, res) =>
    res.json(await service.applicantAction(req.params.folio, req.headers["x-access-key"], req.params.action))
  )
);
router.get(
  "/churches/:churchId/space-requests",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.json(await repository.forChurch(id));
  })
);
router.post(
  "/churches/:churchId/space-requests/:id/:action",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.json(
      await service.staffAction(id, Number(req.params.id), req.params.action, staffInput.parse(req.body), req.user.id)
    );
  })
);
export default router;
