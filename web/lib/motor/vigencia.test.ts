import { describe, it, expect } from "vitest";
import { esAnulada, resumenVigencia } from "./vigencia";
import { calcular } from "./calcular";
import type { FilaExcel } from "./filtros";

/**
 * Regla nueva de Effi: las remisiones "anuladas" (columna Vigencia) NO son venta
 * real. La real son las vigentes; la oficial es todo lo remitido; la diferencia
 * son las anuladas. Los archivos viejos sin columna Vigencia no cambian (todo
 * cuenta como vigente).
 */
function fila(
  cant: number,
  vig: string,
  motivo: string | null = null,
  vend = "ana"
): FilaExcel {
  return {
    Cantidad: cant,
    Vigencia: vig,
    "Observación anulación": motivo,
    Vendedor: vend,
    // Miércoles 15/7/2026 al mediodía → jornada del mismo día (corte 8am).
    "Fecha creación": new Date(2026, 6, 15, 12, 0),
  } as FilaExcel;
}

describe("esAnulada", () => {
  it("detecta anuladas por la palabra 'anulad', tolera mayúsculas", () => {
    expect(esAnulada({ Vigencia: "Remisión anulada" } as FilaExcel)).toBe(true);
    expect(esAnulada({ Vigencia: "ANULADA" } as FilaExcel)).toBe(true);
    expect(esAnulada({ Vigencia: "Remisión vigente" } as FilaExcel)).toBe(false);
    // Archivo viejo sin columna Vigencia = todo vigente.
    expect(esAnulada({} as FilaExcel)).toBe(false);
  });
});

describe("resumenVigencia", () => {
  const filas = [
    fila(2, "Remisión vigente"),
    fila(1, "Remisión vigente"),
    fila(1, "Remisión anulada", "No hay cobertura contraentrega"),
    fila(3, "Remisión anulada", "cambio de color"),
    fila(1, "Remisión anulada", "No hay cobertura contraentrega"),
  ];
  const r = resumenVigencia(filas);

  it("separa venta real (vigentes) de oficial (todo lo remitido)", () => {
    expect(r.remitido).toBe(8); // 2+1+1+3+1
    expect(r.anuladas).toBe(5); // 1+3+1
    expect(r.real).toBe(3); // 2+1
    expect(r.filasAnuladas).toBe(3);
  });

  it("agrupa motivos de anulación de mayor a menor", () => {
    expect(r.motivos[0]).toEqual({ motivo: "cambio de color", cantidad: 3 });
    expect(r.motivos[1]).toEqual({ motivo: "No hay cobertura contraentrega", cantidad: 2 });
  });

  it("archivo sin filas = todo en cero", () => {
    expect(resumenVigencia(null)).toMatchObject({ remitido: 0, real: 0, anuladas: 0 });
  });
});

describe("calcular respeta Vigencia", () => {
  const filasEffi = [
    fila(2, "Remisión vigente", null, "ana"),
    fila(4, "Remisión anulada", "cambio de color", "ana"),
    fila(1, "Remisión vigente", null, "beto"),
  ];
  const R = calcular({
    filasDropi: null,
    filasEffi,
    listaEstatus: [],
    listaVend: [],
    descartarNovedad: true,
    diasManuales: {},
  });
  const k = "2026-07-15";

  it("propias solo cuenta vigentes; las anuladas van aparte", () => {
    expect(R.dias[k].propias).toBe(3); // 2 + 1
    expect(R.dias[k].anuladas).toBe(4); // la anulada
  });

  it("el ranking por vendedor excluye las anuladas", () => {
    expect(R.porVendedorEffi["ana"]).toBe(2); // solo su vigente, no las 4 anuladas
    expect(R.porVendedorEffi["beto"]).toBe(1);
  });
});
