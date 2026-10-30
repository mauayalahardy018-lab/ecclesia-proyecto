import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("HTTP sin base de datos", () => {
  it("responde al control de salud y sirve la interfaz", async () => {
    expect((await request(app).get("/health")).body).toEqual({ status: "ok" });
    const page = await request(app).get("/");
    expect(page.status).toBe(200);
    expect(page.text).toContain("ECCLESIA");
  });
  it("valida los filtros antes de consultar PostgreSQL", async () => {
    const result = await request(app).get("/api/v1/churches?state=YUC");
    expect(result.status).toBe(400);
    expect(result.body.codigo).toBe("VALIDATION_ERROR");
  });
  it("rechaza operaciones privadas sin sesión", async () => {
    const result = await request(app).post("/api/v1/churches").send({});
    expect(result.status).toBe(401);
    expect(result.body.codigo).toBe("UNAUTHENTICATED");
  });
  it("responde 400 a JSON malformado", async () => {
    const result = await request(app).post("/api/v1/auth/login").set("Content-Type", "application/json").send("{");
    expect(result.status).toBe(400);
    expect(result.body.codigo).toBe("INVALID_JSON");
  });
});
