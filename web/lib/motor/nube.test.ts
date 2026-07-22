import { describe, it, expect } from "vitest";
import { filaCierreJornada, resumenCierre, rankingPublico } from "./nube";
import type { Jornada } from "@/types/database";

const cifra = { propias: 10, dropi: 4, ven: { Ana: 7, Beto: 3 }, tie: { T1: 4 } };

describe("filaCierreJornada", () => {
  it("día sin jornada previa → nace la oficial, cerrada, sin fotos", () => {
    const { fila, esNueva } = filaCierreJornada("2026-07-10", cifra, null, "10-jul-2026 09:00", "I1");
    expect(esNueva).toBe(true);
    expect(fila).toEqual({
      fecha: "2026-07-10",
      propias: 10,
      dropi: 4,
      ven: { Ana: 7, Beto: 3 },
      tie: { T1: 4 },
      cerrada: true,
      cerrada_el: "10-jul-2026 09:00",
      fotos: [],
      actualizado: "I1",
    });
  });

  it("re-cierre → lo oficial NO cambia, la cifra nueva va solo como foto", () => {
    const existente: Jornada = {
      fecha: "2026-07-10",
      propias: 10,
      dropi: 4,
      ven: { Ana: 7, Beto: 3 },
      tie: { T1: 4 },
      cerrada: true,
      cerrada_el: "10-jul-2026 09:00",
      fotos: [],
      actualizado: "I1",
    };
    const nueva = { propias: 12, dropi: 5, ven: { Ana: 9, Beto: 3 }, tie: { T1: 5 } };
    const { fila, esNueva } = filaCierreJornada("2026-07-10", nueva, existente, "11-jul-2026 08:00", "I2");
    expect(esNueva).toBe(false);
    // oficial intacto
    expect(fila.propias).toBe(10);
    expect(fila.dropi).toBe(4);
    expect(fila.ven).toEqual({ Ana: 7, Beto: 3 });
    // foto de comparación agregada
    expect(fila.fotos).toEqual([{ cuando: "11-jul-2026 08:00", p: 12, d: 5 }]);
    expect(fila.actualizado).toBe("I2");
  });
});

describe("resumenCierre", () => {
  it("solo nuevas", () => {
    expect(resumenCierre(3, 0)).toBe("cerré 3 jornadas nuevas.");
  });
  it("una nueva y una actualizada", () => {
    expect(resumenCierre(1, 1)).toBe("cerré 1 jornada nueva y actualicé el comparativo de 1 ya cerrada.");
  });
  it("nada", () => {
    expect(resumenCierre(0, 0)).toBe("No había nada que cerrar.");
  });
});

describe("rankingPublico", () => {
  it("suma oficiales del mes y asigna puesto por prendas desc", () => {
    const oficiales = {
      "2026-07-01": { ven: { Ana: 10, Beto: 4 } },
      "2026-07-02": { ven: { Beto: 8 } },
      "2026-06-30": { ven: { Ana: 99 } }, // otro mes, se ignora
    };
    const r = rankingPublico(oficiales, {}, "2026-07");
    expect(r).toEqual([
      { mes: "2026-07", puesto: 1, nombre: "Beto" }, // 12
      { mes: "2026-07", puesto: 2, nombre: "Ana" }, // 10
    ]);
  });

  it("el bosquejo suma salvo que el día ya esté cerrado (manda lo oficial)", () => {
    const oficiales = { "2026-07-01": { ven: { Ana: 5 } } };
    const borradores = {
      "2026-07-01": { ven: { Ana: 100 } }, // ese día ya está cerrado → se ignora
      "2026-07-02": { ven: { Beto: 6 } }, // sin cerrar → cuenta
    };
    const r = rankingPublico(oficiales, borradores, "2026-07");
    expect(r).toEqual([
      { mes: "2026-07", puesto: 1, nombre: "Beto" }, // 6
      { mes: "2026-07", puesto: 2, nombre: "Ana" }, // 5
    ]);
  });

  it("empate en prendas → desempata por nombre ascendente", () => {
    const oficiales = { "2026-07-01": { ven: { Zoe: 5, Ana: 5 } } };
    const r = rankingPublico(oficiales, {}, "2026-07");
    expect(r.map((x) => x.nombre)).toEqual(["Ana", "Zoe"]);
  });

  it("nunca lleva cifras (solo mes/puesto/nombre)", () => {
    const oficiales = { "2026-07-01": { ven: { Ana: 5 } } };
    const r = rankingPublico(oficiales, {}, "2026-07");
    expect(Object.keys(r[0]).sort()).toEqual(["mes", "nombre", "puesto"]);
  });
});
