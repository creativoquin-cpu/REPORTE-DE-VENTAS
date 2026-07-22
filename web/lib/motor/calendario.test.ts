import { describe, it, expect } from "vitest";
import { datoDia, correrMes, mesesConAlgo, marcarRango, resumenSeleccion } from "./calendario";

const jornadas = { "2026-07-01": { propias: 10, dropi: 3 }, "2026-05-20": { propias: 5, dropi: 1 } };
const calc = { "2026-07-01": { propias: 99, dropi: 99 }, "2026-07-02": { propias: 8, dropi: 2 } };

describe("datoDia", () => {
  it("la jornada cerrada manda sobre el bosquejo", () => {
    expect(datoDia("2026-07-01", jornadas, calc)).toEqual({ p: 10, d: 3, t: 13, cerrada: true });
  });
  it("sin jornada, usa el bosquejo (sin cerrar)", () => {
    expect(datoDia("2026-07-02", jornadas, calc)).toEqual({ p: 8, d: 2, t: 10, cerrada: false });
  });
  it("sin dato → null", () => {
    expect(datoDia("2026-07-09", jornadas, calc)).toBeNull();
  });
});

describe("correrMes", () => {
  it("suma y resta meses cruzando el año", () => {
    expect(correrMes("2026-07", 1)).toBe("2026-08");
    expect(correrMes("2026-01", -1)).toBe("2025-12");
    expect(correrMes("2026-07", -1)).toBe("2026-06");
  });
});

describe("mesesConAlgo", () => {
  it("meses con datos, del más reciente al más viejo", () => {
    expect(mesesConAlgo(jornadas, calc)).toEqual(["2026-07", "2026-05"]);
  });
});

describe("marcarRango", () => {
  it("todas las claves entre dos fechas, en orden, sin importar el sentido", () => {
    expect(marcarRango("2026-07-03", "2026-07-01")).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
    ]);
  });
  it("un solo día", () => {
    expect(marcarRango("2026-07-05", "2026-07-05")).toEqual(["2026-07-05"]);
  });
});

describe("resumenSeleccion", () => {
  it("suma solo lo cerrado; cuenta pend y sin datos", () => {
    const r = resumenSeleccion(["2026-07-01", "2026-07-02", "2026-07-09"], jornadas, calc);
    expect(r.n).toBe(1); // solo 01 está cerrado
    expect(r.sP).toBe(10);
    expect(r.sD).toBe(3);
    expect(r.sT).toBe(13);
    expect(r.pend).toBe(1); // 02 sin cerrar
    expect(r.sinDatos).toBe(1); // 09 sin dato
    expect(r.primera).toBe("2026-07-01");
    expect(r.ultima).toBe("2026-07-09");
  });
  it("selección vacía", () => {
    const r = resumenSeleccion([], jornadas, calc);
    expect(r.n).toBe(0);
    expect(r.primera).toBeNull();
  });
});
