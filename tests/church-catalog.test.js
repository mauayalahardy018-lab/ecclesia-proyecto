import { describe, expect, it } from "vitest";
import { URL } from "node:url";
import { realChurches } from "../data/real-churches.js";

describe("catálogo de templos reales", () => {
  it("incluye 40 templos distintos de ocho municipios con fuente y búsqueda de Maps", () => {
    expect(realChurches).toHaveLength(40);
    expect(new Set(realChurches.map((item) => `${item.localityCode}:${item.name}`)).size).toBe(40);
    expect(new Set(realChurches.map((item) => item.localityCode)).size).toBe(8);
    expect(new Set(realChurches.map((item) => item.type))).toEqual(
      new Set(["catedral", "basilica", "parroquia", "templo", "capilla", "santuario"])
    );
    for (const item of realChurches) {
      expect(item.name).not.toMatch(/muestra|fictici/i);
      expect(item.address).toBeTruthy();
      expect(item.mapsQuery).toContain(item.name);
      expect(new URL(item.sourceUrl).protocol).toBe("https:");
    }
    const basilica = realChurches.find((item) => item.type === "basilica");
    expect(basilica.sourceUrl).toContain("sic.cultura.gob.mx");
    expect(basilica.constructionYear).toBe(1561);
  });
});
