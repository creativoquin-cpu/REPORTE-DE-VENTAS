import { describe, it, expect } from "vitest";
import { festivosColombia, porQueNoLaborable } from "./festivos";

// Portado de pruebas/test-motor-real.js §7.

describe("festivosColombia — los 19 festivos de 2026", () => {
  const esperados = [
    "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03", "2026-05-01",
    "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29", "2026-07-13", "2026-07-20",
    "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25",
  ];
  const R = festivosColombia(2026);
  const hallados = Object.keys(R).sort();

  it("son 19 festivos", () => {
    expect(hallados).toHaveLength(19);
  });
  it("coinciden uno por uno con la lista del documento", () => {
    expect(hallados).toEqual(esperados);
  });
  it("el 13-jul es la Virgen de Chiquinquirá (Ley 2578 de 2026)", () => {
    expect(R["2026-07-13"]).toBe("Virgen de Chiquinquirá");
  });
  it("antes de 2026 NO existe la Virgen de Chiquinquirá", () => {
    const R25 = festivosColombia(2025);
    expect(Object.values(R25)).not.toContain("Virgen de Chiquinquirá");
    // 2025 tiene un festivo menos que 2026 justamente por no llevar Chiquinquirá.
    expect(Object.keys(R25).length).toBeLessThan(hallados.length);
  });
});

describe("porQueNoLaborable", () => {
  it("un sábado es no laborable", () => {
    expect(porQueNoLaborable("2026-07-11")).toBe("sábado");
  });
  it("un domingo es no laborable", () => {
    expect(porQueNoLaborable("2026-07-12")).toBe("domingo");
  });
  it("un festivo devuelve su nombre", () => {
    expect(porQueNoLaborable("2026-07-13")).toBe("Virgen de Chiquinquirá");
  });
  it("un día hábil devuelve null", () => {
    expect(porQueNoLaborable("2026-07-14")).toBeNull();
  });
  it("un día marcado a mano gana sobre todo lo demás", () => {
    expect(porQueNoLaborable("2026-07-14", { "2026-07-14": true })).toBe("marcado a mano");
  });
});
