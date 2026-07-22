import { describe, it, expect } from "vitest";
import { datosDelMes, resumenTablero, type JornadaTablero, type CifraTablero } from "./tablero";

const jor = (propias: number, dropi: number, ven: Record<string, number> = {}, tie: Record<string, number> = {}): JornadaTablero => ({
  propias,
  dropi,
  ven,
  tie,
});
const cif = (propias: number, dropi: number, ven: Record<string, number> = {}, tie: Record<string, number> = {}): CifraTablero => ({
  propias,
  dropi,
  ven,
  tie,
});

describe("datosDelMes", () => {
  const jornadas = {
    "2026-07-01": jor(10, 3),
    "2026-06-30": jor(9, 9), // otro mes
  };
  const calc = {
    "2026-07-01": cif(99, 99), // ya cerrado → no pisa
    "2026-07-02": cif(8, 2),
  };
  it("solo cerradas cuando no se incluye bosquejo", () => {
    const D = datosDelMes(jornadas, calc, "2026-07", false);
    expect(Object.keys(D)).toEqual(["2026-07-01"]);
    expect(D["2026-07-01"]).toMatchObject({ p: 10, d: 3, cerrada: true });
  });
  it("con bosquejo suma los días sin cerrar, sin pisar lo cerrado", () => {
    const D = datosDelMes(jornadas, calc, "2026-07", true);
    expect(Object.keys(D).sort()).toEqual(["2026-07-01", "2026-07-02"]);
    expect(D["2026-07-01"]).toMatchObject({ p: 10, cerrada: true }); // no lo pisó el 99
    expect(D["2026-07-02"]).toMatchObject({ p: 8, d: 2, cerrada: false });
  });
});

describe("resumenTablero", () => {
  // Dos días laborables (mié 1 y jue 2 de julio 2026), sin festivos → sin reparto.
  const D = {
    "2026-07-01": { p: 10, d: 3, ven: { Ana: 10 }, tie: { T1: 3 }, cerrada: true },
    "2026-07-02": { p: 8, d: 2, ven: { Beto: 8 }, tie: {}, cerrada: false },
  };
  const R = resumenTablero(D, [], "2026-07-02");

  it("totales, promedio y porcentaje de propias", () => {
    expect(R.total).toBe(23);
    expect(R.tP).toBe(18);
    expect(R.tD).toBe(5);
    expect(R.n).toBe(2);
    expect(R.prom).toBe(12); // round(23/2)
    expect(R.pct).toBe(78); // round(18*100/23)
  });
  it("mejor/peor y cerradas vs abiertas", () => {
    expect(R.mejor).toEqual({ k: "2026-07-01", t: 13, cerrada: true });
    expect(R.peor).toEqual({ k: "2026-07-02", t: 10, cerrada: false });
    expect(R.abiertas).toBe(1);
    expect(R.cerradasN).toBe(1);
  });
  it("metas por día (defaults 200/160) y sumas del periodo", () => {
    expect(R.metaT).toEqual([200, 200]);
    expect(R.metaSumaT).toBe(400);
    expect(R.metaSumaP).toBe(320);
    expect(R.enMetaT).toBe(0);
  });
  it("hoy = el día en curso", () => {
    expect(R.hoy).toBe(10); // 2026-07-02 → 8+2
    expect(R.hoyCerrada).toBe(false);
  });
  it("rankings por vendedor y tienda (con desempate por nombre)", () => {
    expect(R.rankingVend).toEqual([
      { nombre: "Ana", n: 10 },
      { nombre: "Beto", n: 8 },
    ]);
    expect(R.rankingTie).toEqual([{ nombre: "T1", n: 3 }]);
    expect(R.faltan).toBe(0);
  });

  it("reparte el fin de semana con el sobrante al último día", () => {
    // sáb 4 + dom 5 de julio 2026 son no laborables → bloque de 2 días.
    const D2 = {
      "2026-07-03": { p: 10, d: 0, ven: {}, tie: {}, cerrada: true }, // vie
      "2026-07-04": { p: 3, d: 0, ven: {}, tie: {}, cerrada: true }, // sáb
      "2026-07-05": { p: 5, d: 0, ven: {}, tie: {}, cerrada: true }, // dom
    };
    const R2 = resumenTablero(D2, [], "2026-07-05");
    // el bloque sáb+dom suma 8 propias → repartir(8,2) = [4,4]
    expect(R2.repP).toEqual([10, 4, 4]);
  });
});
