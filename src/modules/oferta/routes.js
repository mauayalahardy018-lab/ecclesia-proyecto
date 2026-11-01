import { Router } from "express";
import { z } from "zod";
import { route, notFound } from "../../lib/errors.js";
import { authenticate, requireChurch, requireRole } from "../../infrastructure/auth/access.js";
import * as repository from "./repository.js";
import * as service from "./service.js";
import { ensureActive } from "../iglesias/service.js";

const router = Router();
const money = z.string().regex(/^\d+(?:\.\d{1,2})?$/);
const serviceInput = z.object({
  name: z.string().min(2),
  requirements: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  appointmentRequired: z.boolean(),
  priceKind: z.enum(["fijo", "gratuito", "donativo"]),
  price: money.optional(),
  scheduleText: z.string().min(1)
});
const talkInput = z.object({
  type: z.string().min(2),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  sessions: z.number().int().positive(),
  price: money.optional(),
  capacity: z.number().int().positive(),
  place: z.string().min(1),
  instructor: z.string().min(1)
});
const talkSearch = z.object({
  municipality: z.string().regex(/^\d{5}$/),
  type: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

router.get(
  "/talks",
  route(async (req, res) => res.json(await repository.searchTalks(talkSearch.parse(req.query))))
);

router.get(
  "/churches/:churchId/services",
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await ensureActive(id);
    res.json(await repository.listServices(id));
  })
);
router.get(
  "/churches/:churchId/services/manage",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.json(await repository.allServices(id));
  })
);
router.get(
  "/churches/:churchId/talks",
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await ensureActive(id);
    res.json(await repository.listTalks(id));
  })
);
router.get(
  "/churches/:churchId/talks/manage",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.json(await repository.allTalks(id));
  })
);
router.post(
  "/churches/:churchId/services",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.status(201).json(await service.addService(id, serviceInput.parse(req.body)));
  })
);
router.post(
  "/churches/:churchId/talks",
  authenticate,
  requireRole("coordinacion", "administrador_iglesia"),
  route(async (req, res) => {
    const id = Number(req.params.churchId);
    await requireChurch(req, id);
    res.status(201).json(await service.addTalk(id, talkInput.parse(req.body)));
  })
);
for (const kind of ["services", "talks"]) {
  router.put(
    `/churches/:churchId/${kind}/:id`,
    authenticate,
    requireRole("coordinacion", "administrador_iglesia"),
    route(async (req, res) => {
      const churchId = Number(req.params.churchId);
      await requireChurch(req, churchId);
      const input = (kind === "services" ? serviceInput : talkInput).parse(req.body);
      res.json(
        await (kind === "services" ? service.updateService : service.updateTalk)(churchId, Number(req.params.id), input)
      );
    })
  );
  router.patch(
    `/churches/:churchId/${kind}/:id/active`,
    authenticate,
    requireRole("coordinacion", "administrador_iglesia"),
    route(async (req, res) => {
      const churchId = Number(req.params.churchId);
      await requireChurch(req, churchId);
      const { active } = z.object({ active: z.boolean() }).parse(req.body);
      const updated = await (kind === "services" ? repository.setServiceActive : repository.setTalkActive)(
        churchId,
        Number(req.params.id),
        active
      );
      if (!updated) throw notFound();
      res.json(updated);
    })
  );
}
export default router;
