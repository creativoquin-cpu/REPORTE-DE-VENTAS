import { describe, it, expect } from "vitest";
import { resumenEquipo, type JornadaPublicaDia } from "./equipo";

// Portado de pruebas/test-vendedor-publico.js §2, §3, §4.
// Julio 2026: 13 lun, 14 mar, 15 mié, 18 sáb, 19 dom.

function cerrado(propias: number): JornadaPublicaDia {
  return { propias, cerrada: true };
}

describe("resumenEquipo — mes con reparto de fin de semana", () => {
  const jornadas: Record<string, JornadaPublicaDia> = {
    "2026-07-13": cerrado(200),
    "2026-07-14": cerrado(190),
    "2026-07-15": cerrado(150),
    "2026-07-18": cerrado(71), // sábado
    "2026-07-19": cerrado(24), // domingo
  };
  const R = resumenEquipo(jornadas, [], {}, "2026-07-20");

  it("prendas propias del equipo = 635", () => {
    expect(R.total).toBe(635);
  });
  it("promedio por día = 127", () => {
    expect(R.promedio).toBe(127);
  });
  it("días en meta = 2 de 5", () => {
    expect(R.diasEnMeta).toBe(2);
  });
  it("mejor día del equipo = 200", () => {
    expect(R.mejor?.valor).toBe(200);
    expect(R.mejor?.clave).toBe("2026-07-13");
  });
  it("el reparto del fin de semana (71+24=95 → 47/48) da la serie del gráfico", () => {
    expect(R.porDia).toEqual([200, 190, 150, 47, 48]);
  });
  it("sin metas guardadas, la meta de propias por día es 160", () => {
    expect(R.metaPorDia).toEqual([160, 160, 160, 160, 160]);
    expect(R.metaPeriodo).toBe(800);
  });
  it("no hay días abiertos (todo cerrado)", () => {
    expect(R.abiertas).toEqual([]);
    expect(R.ultimaSubida).toBeNull();
  });
});

describe("resumenEquipo — mes sin ninguna venta", () => {
  const R = resumenEquipo({}, [], {}, "2026-07-20");
  it("no hay claves ni total", () => {
    expect(R.claves).toEqual([]);
    expect(R.total).toBe(0);
    expect(R.promedio).toBe(0);
    expect(R.mejor).toBeNull();
  });
});

describe("resumenEquipo — bosquejo (días sin cerrar)", () => {
  const jornadas: Record<string, JornadaPublicaDia> = {
    "2026-07-13": { propias: 200, cerrada: true, actualizado: "2026-07-13T09:00:00.000Z" },
    "2026-07-14": { propias: 190, cerrada: true, actualizado: "2026-07-14T09:00:00.000Z" },
    "2026-07-15": { propias: 150, cerrada: false, actualizado: "2026-07-20T08:30:00.000Z" },
  };
  const R = resumenEquipo(jornadas, [], {}, "2026-07-20");

  it("el total SÍ incluye el bosquejo (200+190+150 = 540)", () => {
    expect(R.total).toBe(540);
  });
  it("marca 1 día abierto y su última subida", () => {
    expect(R.abiertas).toEqual(["2026-07-15"]);
    expect(R.ultimaSubida).toBe("2026-07-20T08:30:00.000Z");
  });
});

describe("resumenEquipo — día nulo (descanso / sin ventas)", () => {
  const jornadas: Record<string, JornadaPublicaDia> = {
    "2026-07-18": cerrado(315), // sábado
    "2026-07-19": cerrado(30), // domingo, se marcará nulo
  };
  const R = resumenEquipo(jornadas, [], {}, "2026-07-20", { "2026-07-19": true });

  it("el domingo nulo sale del mes y sus propias pasan al sábado (315+30=345)", () => {
    expect(R.claves).toEqual(["2026-07-18"]);
    expect(R.porDia).toEqual([345]);
    expect(R.total).toBe(345);
  });
  it("no cuenta como día: el promedio es sobre 1 día, no 2", () => {
    expect(R.promedio).toBe(345);
  });
});
