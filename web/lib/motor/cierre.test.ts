import { describe, it, expect } from "vitest";
import { estadoMes, resumenMensualCerrado, mesDeClave } from "./cierre";

describe("estadoMes", () => {
  it("con sello cerrado → cerrado", () => {
    expect(estadoMes("2026-05", { estado: "cerrado" }, "2026-07")).toBe("cerrado");
  });
  it("con sello abierto (reabierto a mano) → reabierto", () => {
    expect(estadoMes("2026-05", { estado: "abierto" }, "2026-07")).toBe("reabierto");
  });
  it("sin sello y mes pasado → pendiente", () => {
    expect(estadoMes("2026-06", null, "2026-07")).toBe("pendiente");
  });
  it("sin sello y mes en curso → en curso", () => {
    expect(estadoMes("2026-07", undefined, "2026-07")).toBe("en curso");
  });
  it("sin sello y mes futuro → en curso (no se cierra lo que no pasó)", () => {
    expect(estadoMes("2026-08", null, "2026-07")).toBe("en curso");
  });
});

describe("resumenMensualCerrado", () => {
  const jornadas = {
    "2026-07-01": { propias: 10, dropi: 3 },
    "2026-07-02": { propias: 8, dropi: 2 },
    "2026-06-30": { propias: 5, dropi: 1 },
  };
  it("suma solo las jornadas del mes pedido", () => {
    expect(resumenMensualCerrado(jornadas, "2026-07")).toEqual({
      dias: 2,
      total: 23,
      p: 18,
      d: 5,
    });
  });
  it("mes sin jornadas → todo en cero", () => {
    expect(resumenMensualCerrado(jornadas, "2026-01")).toEqual({ dias: 0, total: 0, p: 0, d: 0 });
  });
});

describe("mesDeClave", () => {
  it("recorta a YYYY-MM", () => {
    expect(mesDeClave("2026-07-15")).toBe("2026-07");
  });
});
