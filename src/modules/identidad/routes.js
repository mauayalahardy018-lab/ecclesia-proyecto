import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../infrastructure/auth/access.js";
import { route } from "../../lib/errors.js";
import * as service from "./service.js";

const router = Router();
const loginInput = z.object({ email: z.email(), password: z.string().min(1) });
const roles = z.enum(["coordinacion", "administrador_iglesia", "tesorero"]);
const userInput = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(10),
  role: roles,
  churchIds: z.array(z.number().int().positive()).default([])
});
const updateInput = z.object({
  name: z.string().trim().min(2),
  role: roles,
  active: z.boolean(),
  churchIds: z.array(z.number().int().positive()).default([])
});

router.post(
  "/auth/login",
  route(async (req, res) => res.json(await service.login(loginInput.parse(req.body))))
);
router.get("/me", authenticate, (req, res) => res.json(req.user));
router.get(
  "/me/churches",
  authenticate,
  route(async (req, res) => res.json(await service.churchesFor(req.user)))
);
router.get(
  "/users",
  authenticate,
  requireRole("coordinacion"),
  route(async (_req, res) => res.json(await service.listUsers()))
);
router.post(
  "/users",
  authenticate,
  requireRole("coordinacion"),
  route(async (req, res) => res.status(201).json(await service.createUser(userInput.parse(req.body))))
);
router.put(
  "/users/:id",
  authenticate,
  requireRole("coordinacion"),
  route(async (req, res) => res.json(await service.updateUser(Number(req.params.id), updateInput.parse(req.body))))
);
router.put(
  "/users/:id/password",
  authenticate,
  requireRole("coordinacion"),
  route(async (req, res) => {
    const { password } = z.object({ password: z.string().min(10) }).parse(req.body);
    res.json(await service.resetPassword(Number(req.params.id), password));
  })
);
export default router;
