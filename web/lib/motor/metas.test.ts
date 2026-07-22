import { describe, it, expect } from "vitest";
import { metaEn } from "./metas";
import type { Meta } from "@/types/database";

// Portado de pruebas/test-metas.js §1-§4.
// Helper para armar filas de meta sin repetir campos irrelevantes al cálculo.
function meta(id: number, desde: string, total: number, propias: number): Meta {
  return { id, desde, total, propias, cuando: null, quien: "Administrador", actualizado: "" };
}

describe("metaEn — meta por defecto cuando no hay historial", () => {
  it("cualquier día da 200/160", () => {
    expect(metaEn("2026-07-14", [])).toMatchObject({ total: 200, propias: 160 });
    expect(metaEn("2020-03-05", [])).toMatchObject({ total: 200, propias: 160 });
  });
});

describe("metaEn — un cambio a mitad de mes: los días pasados conservan la suya", () => {
  const h = [meta(1, "2026-07-16", 240, 180)];
  it("14-jul conserva 200/160", () => {
    expect(metaEn("2026-07-14", h)).toMatchObject({ total: 200, propias: 160 });
  });
  it("15-jul (día antes) sigue en 200", () => {
    expect(metaEn("2026-07-15", h).total).toBe(200);
  });
  it("16-jul (el mismo día) ya es 240/180", () => {
    expect(metaEn("2026-07-16", h)).toMatchObject({ total: 240, propias: 180 });
  });
  it("31-jul en adelante es 240", () => {
    expect(metaEn("2026-07-31", h).total).toBe(240);
  });
});

describe("metaEn — varios cambios encadenados y meta programada al futuro", () => {
  const h = [
    meta(3, "2026-08-01", 260, 200),
    meta(1, "2026-02-01", 180, 140),
    meta(2, "2026-07-16", 240, 180),
  ];
  it("enero conserva 200 (antes del primer cambio)", () => {
    expect(metaEn("2026-01-20", h).total).toBe(200);
  });
  it("febrero a julio-15 → 180", () => {
    expect(metaEn("2026-02-01", h).total).toBe(180);
    expect(metaEn("2026-07-15", h).total).toBe(180);
  });
  it("julio-16 a julio-31 → 240", () => {
    expect(metaEn("2026-07-16", h).total).toBe(240);
    expect(metaEn("2026-07-31", h).total).toBe(240);
  });
  it("agosto → 260", () => {
    expect(metaEn("2026-08-05", h).total).toBe(260);
  });
});

describe("metaEn — dos metas con la misma fecha: manda la registrada después", () => {
  const h = [meta(10, "2026-07-01", 220, 170), meta(20, "2026-07-01", 210, 165)];
  it("vale la última registrada (id mayor → 210)", () => {
    expect(metaEn("2026-07-05", h).total).toBe(210);
  });
});
