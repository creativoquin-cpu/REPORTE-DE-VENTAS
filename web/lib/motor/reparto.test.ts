import { describe, it, expect } from "vitest";
import { repartir, armarBloques } from "./reparto";

// Ver docs/BUSINESS-RULES.md regla 3 y pruebas/test-motor-real.js §3b.

describe("repartir — parejo en enteros, todo el sobrante al último día", () => {
  it("8 entre 3 → 2 / 2 / 4 (el sobrante al último)", () => {
    expect(repartir(8, 3)).toEqual([2, 2, 4]);
  });
  it("no cambia el total repartido", () => {
    const r = repartir(8, 3);
    expect(r.reduce((a, b) => a + b, 0)).toBe(8);
  });
  it("reparto exacto sin sobrante", () => {
    expect(repartir(9, 3)).toEqual([3, 3, 3]);
  });
  it("un solo día se queda con todo", () => {
    expect(repartir(8, 1)).toEqual([8]);
  });
  it("cero se reparte en ceros", () => {
    expect(repartir(0, 3)).toEqual([0, 0, 0]);
  });
});

describe("armarBloques — agrupa días no laborables consecutivos", () => {
  it("sáb+dom+lun-festivo forman un bloque de 3", () => {
    // 11 sáb, 12 dom, 13 lun (Virgen de Chiquinquirá 2026)
    const bloques = armarBloques(["2026-07-10", "2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14"]);
    expect(bloques).toHaveLength(1);
    expect(bloques[0].dias).toEqual(["2026-07-11", "2026-07-12", "2026-07-13"]);
  });
  it("un día hábil entre dos no laborables corta el bloque", () => {
    // sáb 11 · [hábil 14] · sáb 18 → dos bloques separados
    const bloques = armarBloques(["2026-07-11", "2026-07-14", "2026-07-18"]);
    expect(bloques).toHaveLength(2);
  });
  it("días marcados a mano cuentan como no laborables", () => {
    const bloques = armarBloques(["2026-07-14", "2026-07-15"], { "2026-07-14": true, "2026-07-15": true });
    expect(bloques).toHaveLength(1);
    expect(bloques[0].dias).toEqual(["2026-07-14", "2026-07-15"]);
  });
});
