import { Router } from "express";
import { z } from "zod";
import { query, transaction } from "../../infrastructure/db/pool.js";
import {
  authenticate,
  hashPassword,
  requireRole,
  signToken,
  verifyPassword
} from "../../infrastructure/auth/access.js";
import { AppError, conflict, route } from "../../lib/errors.js";

const router = Router();
const loginInput = z.object({ email: z.email(), password: z.string().min(1) });
const userInput = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(10),
  role: z.enum(["coordinacion", "administrador_iglesia", "tesorero"]),
  churchIds: z.array(z.number().int().positive()).default([])
});

router.post(
  "/auth/login",
  route(async (req, res) => {
    const input = loginInput.parse(req.body);
    const result = await query(
      "SELECT id,name,email,role,password_hash FROM users WHERE lower(email)=lower($1) AND active=true",
      [input.email]
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(input.password, user.password_hash)))
      throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales inválidas");
    const safe = { ...user };
    delete safe.password_hash;
    res.json({ token: signToken(user), expiresInSeconds: 7200, user: safe });
  })
);
router.get("/me", authenticate, (req, res) => res.json(req.user));
router.get(
  "/me/churches",
  authenticate,
  route(async (req, res) => {
    const rows =
      req.user.role === "coordinacion"
        ? await query("SELECT id,name,type,state_code,municipality_code,status FROM churches ORDER BY name")
        : await query(
            "SELECT c.id,c.name,c.type,c.state_code,c.municipality_code,c.status FROM churches c JOIN user_churches uc ON uc.church_id=c.id WHERE uc.user_id=$1 ORDER BY c.name",
            [req.user.id]
          );
    res.json(rows.rows);
  })
);
router.post(
  "/users",
  authenticate,
  requireRole("coordinacion"),
  route(async (req, res) => {
    const input = userInput.parse(req.body);
    if (input.role !== "coordinacion" && input.churchIds.length === 0)
      throw conflict("Un usuario local necesita al menos una iglesia asignada");
    const existing = await query("SELECT 1 FROM users WHERE lower(email)=lower($1)", [input.email]);
    if (existing.rowCount) throw conflict("Correo ya registrado");
    const passwordHash = await hashPassword(input.password);
    const user = await transaction(async (client) => {
      const created = await client.query(
        "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role",
        [input.name, input.email.toLowerCase(), passwordHash, input.role]
      );
      for (const churchId of new Set(input.churchIds))
        await client.query("INSERT INTO user_churches(user_id,church_id) VALUES($1,$2)", [
          created.rows[0].id,
          churchId
        ]);
      return created.rows[0];
    });
    res.status(201).json(user);
  })
);
export default router;
