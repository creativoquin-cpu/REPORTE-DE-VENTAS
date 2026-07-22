import { describe, it, expect } from "vitest";
import {
  resumenCmp,
  corteComun,
  delta,
  topCmp,
  tablaPersonas,
  mesesComparables,
  difSellado,
} from "./comparativo";
import { SIN_TIENDA } from "./filtros";
import type { DiaTablero } from "./tablero";

function dia(p: number, d: number, cerrada = true, ven = {}, tie = {}): DiaTablero {
  return { p, d, ven, tie, cerrada };
}

const julio: Record<string, DiaTablero> = {
  "2026-07-01": dia(10, 5, true, { Ana: 10 }, { Tienda1: 5 }),
  "2026-07-02": dia(20, 0, true, { Ana: 12, Beto: 8 }, {}),
  "2026-07-03": dia(6, 4, false, { Beto: 6 }, { Tienda2: 4 }),
};

describe("resumenCmp", () => {
  it("suma el mes entero cuando no hay corte", () => {
    const r = resumenCmp("2026-07", julio, 0);
    expect(r.n).toBe(3);
    expect(r.p).toBe(36);
    expect(r.d).toBe(9);
    expect(r.total).toBe(45);
    expect(r.abiertas).toBe(1);
    expect(r.prom).toBe(15);
    expect(r.pct).toBe(80);
    expect(r.mejor).toEqual({ k: "2026-07-02", t: 20 });
    expect(r.peor).toEqual({ k: "2026-07-03", t: 10 });
    expect(r.ven).toEqual({ Ana: 22, Beto: 14 });
    expect(r.tie).toEqual({ Tienda1: 5, Tienda2: 4 });
  });

  it("el corte toma solo los primeros N días con datos", () => {
    const r = resumenCmp("2026-07", julio, 2);
    expect(r.n).toBe(2);
    expect(r.total).toBe(35);
    expect(r.abiertas).toBe(0); // el día sin cerrar era el tercero
    expect(r.ven).toEqual({ Ana: 22, Beto: 8 });
  });

  it("mes vacío no divide por cero", () => {
    const r = resumenCmp("2026-06", {}, 0);
    expect(r).toMatchObject({ n: 0, total: 0, prom: 0, pct: 0, mejor: null, peor: null });
  });
});

describe("corteComun", () => {
  it("toma el mes más corto con datos", () => {
    expect(corteComun([31, 12, 20])).toBe(12);
  });
  it("ignora los meses sin datos", () => {
    expect(corteComun([31, 0, 20])).toBe(20);
  });
  it("un solo mes o ninguno con datos → sin corte", () => {
    expect(corteComun([31])).toBe(0);
    expect(corteComun([0, 0])).toBe(0);
  });
});

describe("delta", () => {
  it("sube, baja e igual", () => {
    expect(delta(120, 100)).toEqual({ dif: 20, pct: 20 });
    expect(delta(80, 100)).toEqual({ dif: -20, pct: 20 });
    expect(delta(100, 100)).toEqual({ dif: 0, pct: 0 });
  });
  it("sin mes anterior → null; anterior en cero → sin porcentaje", () => {
    expect(delta(120, null)).toBeNull();
    expect(delta(120, 0)).toEqual({ dif: 120, pct: 0 });
  });
});

describe("topCmp", () => {
  it("el más alto, ignorando el cubo sin tienda", () => {
    expect(topCmp({ Ana: 5, Beto: 9, [SIN_TIENDA]: 99 })).toEqual({ nombre: "Beto", n: 9 });
  });
  it("empate: desempata por nombre", () => {
    expect(topCmp({ Zoe: 9, Ana: 9 })).toEqual({ nombre: "Ana", n: 9 });
  });
  it("mapa vacío (o solo sin tienda) → null", () => {
    expect(topCmp({ [SIN_TIENDA]: 4 })).toBeNull();
  });
});

describe("tablaPersonas", () => {
  it("una fila por persona, serie alineada con los meses y delta del último", () => {
    const R = [
      resumenCmp("2026-06", { "2026-06-01": dia(5, 0, true, { Ana: 5 }, {}) }, 0),
      resumenCmp("2026-07", julio, 0),
    ];
    const filas = tablaPersonas(R, "ven");
    expect(filas.map((f) => f.nombre)).toEqual(["Ana", "Beto"]);
    expect(filas[0]).toEqual({
      nombre: "Ana",
      serie: [5, 22],
      total: 27,
      delta: { dif: 17, pct: 340 },
    });
    // Beto no vendió en junio: la serie rellena con 0.
    expect(filas[1].serie).toEqual([0, 14]);
    expect(filas[1].delta).toEqual({ dif: 14, pct: 0 });
  });

  it("sin detalle guardado → sin filas", () => {
    expect(tablaPersonas([resumenCmp("2026-07", { "2026-07-01": dia(3, 1) }, 0)], "ven")).toEqual([]);
  });
});

describe("mesesComparables", () => {
  const jornadas = { "2026-07-01": { propias: 1, dropi: 0, ven: {}, tie: {} } };
  const calc = { "2026-08-01": { propias: 1, dropi: 0, ven: {}, tie: {} } };

  it("del más antiguo al más reciente, con bosquejo", () => {
    expect(mesesComparables(jornadas, calc, true)).toEqual(["2026-07", "2026-08"]);
  });
  it("sin bosquejo, solo los meses con jornadas cerradas", () => {
    expect(mesesComparables(jornadas, calc, false)).toEqual(["2026-07"]);
  });
});

describe("difSellado", () => {
  const jornadas = {
    "2026-07-01": { propias: 10, dropi: 5 },
    "2026-07-02": { propias: 20, dropi: 0 },
  };
  const sello = (total: number, dias: number) =>
    ({
      estado: "cerrado" as const,
      cerrado: "1-ago-2026 09:00",
      auto: false,
      resumen: { dias, total, p: total, d: 0, prom: 0, pct: 100, mejor: null, peor: null, ven: {}, tie: {}, enMetaT: 0, enMetaP: 0, sinDetalle: 0 },
      traza: [],
    });

  it("detecta que el mes cambió después de sellarlo", () => {
    expect(difSellado(sello(30, 2), jornadas, "2026-07")).toEqual({
      sellado: 30,
      ahora: 35,
      dif: 5,
      diasSellados: 2,
      diasAhora: 2,
    });
  });
  it("mes reabierto o sin sellar → null", () => {
    expect(difSellado({ ...sello(30, 2), estado: "abierto" }, jornadas, "2026-07")).toBeNull();
    expect(difSellado(null, jornadas, "2026-07")).toBeNull();
  });
});
