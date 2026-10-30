import { Router } from "express";
import { query } from "../../infrastructure/db/pool.js";
import { route } from "../../lib/errors.js";

const router = Router();
router.get(
  "/states",
  route(async (_req, res) => res.json((await query("SELECT code,name FROM states ORDER BY name")).rows))
);
router.get(
  "/municipalities",
  route(async (req, res) =>
    res.json(
      (
        await query("SELECT code,state_code,name FROM municipalities WHERE state_code=$1 ORDER BY name", [
          req.query.state || ""
        ])
      ).rows
    )
  )
);
router.get(
  "/localities",
  route(async (req, res) =>
    res.json(
      (
        await query("SELECT code,municipality_code,name FROM localities WHERE municipality_code=$1 ORDER BY name", [
          req.query.municipality || ""
        ])
      ).rows
    )
  )
);
export default router;
