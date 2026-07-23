import { describe, it, expect } from "vitest";
import { datosImagen, mesImagen } from "./imagen";
import type { JornadaTablero, CifraTablero } from "./tablero";
import type { MetaHistorial } from "./metas";

// Puerto de pruebas/test-imagen.js (secciones 1, 5, 6, 6b, 6c).
function jor(p: number, d: number): JornadaTablero {
  return { propias: p, dropi: d, ven: { Ana: p }, tie: { TiendaX: d } };
}

// Julio 2026: 13 lun, 14 mar, 15 mié, 18 sáb, 19 dom.
const JUL: Record<string, JornadaTablero> = {
  "2026-07-13": jor(150, 50), // 200
  "2026-07-14": jor(140, 60), // 200
  "2026-07-15": jor(120, 30), // 150
  "2026-07-18": jor(60, 11), // sábado 71
  "2026-07-19": jor(20, 4), // domingo 24
};
const SIN_CALC: Record<string, CifraTablero> = {};
const SIN_METAS: MetaHistorial[] = [];

describe("datosImagen · los números del día (consolidado)", () => {
  const d = datosImagen(JUL, SIN_CALC, SIN_METAS, "2026-07")!;

  it("el día reportado es el último cargado", () => {
    expect(d.dia).toBe("2026-07-19");
  });
  it("el bloque sáb+dom va repartido (el sobrante al último)", () => {
    expect(d.diaTotal).toBe(48);
    expect(d.diaP).toBe(40);
    expect(d.diaD).toBe(8);
    expect(d.diaP + d.diaD).toBe(d.diaTotal);
  });
  it("promedio del mes, meta del día y total del mes", () => {
    expect(d.prom).toBe(129);
    expect(d.metaDia).toBe(200);
    expect(d.total).toBe(645);
  });
  it("barras repartidas: 200,200,150,47,48 y suman el mes", () => {
    expect(d.claves.map((k) => d.rep[k])).toEqual([200, 200, 150, 47, 48]);
    expect(d.claves.reduce((a, k) => a + d.rep[k], 0)).toBe(645);
  });
});

describe("datosImagen · ventas propias (Effi)", () => {
  const d = datosImagen(JUL, SIN_CALC, SIN_METAS, "2026-07")!;

  it("totales y barras de solo propias", () => {
    expect(d.totalP).toBe(490);
    expect(d.claves.map((k) => d.repP[k])).toEqual([150, 140, 120, 40, 40]);
    expect(d.promP).toBe(98);
    expect(d.metaDiaP).toBe(160);
    expect(d.enMetaP).toBe(0); // ninguno llega a 160
  });
});

describe("datosImagen · meta escalonada", () => {
  const metas: MetaHistorial[] = [{ id: 1, desde: "2026-07-15", total: 100, propias: 80 }];
  const d = datosImagen(JUL, SIN_CALC, metas, "2026-07")!;

  it("la meta de cada día viene del historial", () => {
    expect(d.metas).toEqual([200, 200, 100, 100, 100]);
  });
  it("días en meta con la meta de cada día = 3", () => {
    const enMeta = d.claves.filter((k, i) => d.rep[k] >= d.metas[i]).length;
    expect(enMeta).toBe(3);
    expect(d.enMeta).toBe(3);
  });
});

describe("datosImagen · casos borde", () => {
  it("un mes sin datos → null", () => {
    expect(datosImagen({}, SIN_CALC, SIN_METAS, "2026-07")).toBeNull();
  });

  it("mes completo de 31 días", () => {
    const largo: Record<string, JornadaTablero> = {};
    for (let i = 1; i <= 31; i++) largo[`2026-07-${String(i).padStart(2, "0")}`] = jor(100 + i, 20);
    const d = datosImagen(largo, SIN_CALC, SIN_METAS, "2026-07")!;
    expect(d.n).toBe(31);
    expect(d.dia).toBe("2026-07-31");
  });

  it("cuenta los días sin cerrar que entran del bosquejo", () => {
    const calc: Record<string, CifraTablero> = {
      "2026-07-20": { propias: 30, dropi: 5, ven: {}, tie: {} },
    };
    const d = datosImagen(JUL, calc, SIN_METAS, "2026-07")!;
    expect(d.n).toBe(6);
    expect(d.sinCerrar).toBe(1); // el 20 es bosquejo
    expect(d.dia).toBe("2026-07-20");
  });
});

describe("mesImagen", () => {
  it("sin Excel cargado, usa el mes en curso", () => {
    expect(mesImagen({}, "2026-07")).toBe("2026-07");
  });
  it("con Excel cargado, manda el mes del último día del archivo", () => {
    const calc: Record<string, CifraTablero> = {
      "2026-06-10": { propias: 1, dropi: 0, ven: {}, tie: {} },
      "2026-08-03": { propias: 1, dropi: 0, ven: {}, tie: {} },
    };
    expect(mesImagen(calc, "2026-07")).toBe("2026-08");
  });
});
