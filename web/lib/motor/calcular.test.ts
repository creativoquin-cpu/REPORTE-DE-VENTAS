import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import { calcular, type ResultadoCalculo } from "./calcular";
import {
  identificar,
  APAGADO_DROPI,
  APAGADO_EFFI,
  type FilaExcel,
} from "./filtros";
import { festivosColombia } from "./festivos";

/**
 * Validación del MOTOR con los dos Excel REALES de la carpeta.
 * Portado de pruebas/test-motor-real.js — mismos números de referencia (§17).
 * A diferencia del arnés jsdom original, acá corremos en Node puro: las fechas
 * que crea SheetJS SÍ son `instanceof Date` para nuestro código, así que no
 * hace falta re-envolverlas.
 */

// La app vieja vive en la raíz del repo; Vitest corre desde web/.
const RAIZ = path.resolve(process.cwd(), "..");
const F_EFFI = "Reporte de conceptos de remisiones de venta 2026-07-12.xlsx";
const F_DROPI = "ordenes_productos_20260712_111712.xlsx";

// Lee un Excel igual que la página: primera hoja, defval null, fechas como Date.
function leer(archivo: string): FilaExcel[] {
  const libro = XLSX.read(fs.readFileSync(path.join(RAIZ, archivo)), {
    type: "buffer",
    cellDates: true,
  });
  return XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], {
    defval: null,
  }) as FilaExcel[];
}

let filasEffi: FilaExcel[];
let filasDropi: FilaExcel[];
let C: ResultadoCalculo["dias"];
let R: ResultadoCalculo;
let dias: string[];

beforeAll(() => {
  filasEffi = leer(F_EFFI);
  filasDropi = leer(F_DROPI);
  // construirFiltros en la primera carga = identificar (sin ajustes previos).
  const listaEstatus = identificar(filasDropi, "ESTATUS", "CANTIDAD", APAGADO_DROPI, "(sin estatus)");
  const listaVend = identificar(filasEffi, "Vendedor", "Cantidad", APAGADO_EFFI, "(sin vendedor)");
  R = calcular({
    filasDropi,
    filasEffi,
    listaEstatus,
    listaVend,
    descartarNovedad: true,
    diasManuales: {},
  });
  C = R.dias;
  dias = Object.keys(C).sort();
});

const sum = (f: (v: ResultadoCalculo["dias"][string]) => number) =>
  dias.reduce((a, k) => a + f(C[k]), 0);

describe("0. Los archivos se leen", () => {
  it("ambos Excel traen filas y las columnas esperadas", () => {
    expect(filasEffi.length).toBeGreaterThan(0);
    expect(filasDropi.length).toBeGreaterThan(0);
    expect(["Vendedor", "Fecha creación", "Cantidad"].every((c) => c in filasEffi[0])).toBe(true);
    expect(["ESTATUS", "FECHA", "HORA"].every((c) => c in filasDropi[0])).toBe(true);
  });
});

describe("1. Totales contra los números de referencia (§17)", () => {
  it("el archivo de Effi trae 99 unidades crudas", () => {
    const crudo = filasEffi.reduce((a, r) => a + Number(r["Cantidad"] || 0), 0);
    expect(crudo).toBe(99);
  });
  it("el motor cuenta 98 propias (descarta 1 del vendedor apagado por defecto)", () => {
    expect(sum((v) => v.propias)).toBe(98);
  });
  it("Dropi suma 20 unidades (24 filas − 4 canceladas)", () => {
    expect(sum((v) => v.dropi)).toBe(20);
  });
  it("el total combinado es 118", () => {
    expect(sum((v) => v.propias + v.dropi)).toBe(118);
  });
});

describe("2. Effi también usa el corte de jornada", () => {
  it("las 98 propias quedan en la jornada del viernes 2026-07-10", () => {
    expect(C["2026-07-10"].propias).toBe(98);
  });
  it("el sábado no se queda con las de la madrugada", () => {
    expect(C["2026-07-11"].propias).toBe(0);
  });
  it("ningún otro día tiene propias", () => {
    expect(dias.filter((k) => k !== "2026-07-10" && C[k].propias > 0)).toEqual([]);
  });
  it("la vendedora líder es Lucenith Quintero Leon con 24", () => {
    const ven = C["2026-07-10"].ven;
    const top = Object.keys(ven).sort((a, b) => ven[b] - ven[a])[0];
    expect(top).toBe("Lucenith Quintero Leon");
    expect(ven[top]).toBe(24);
  });
  it("el vendedor apagado por defecto no aparece en el detalle", () => {
    expect("miguel angel angarita ariza" in C["2026-07-10"].ven).toBe(false);
  });
  it("DROPI - ROCKETFY cuenta como venta propia (confirmado por el dueño)", () => {
    expect(C["2026-07-10"].ven["DROPI - ROCKETFY"]).toBe(1);
  });
});

describe("3. Dropi día por día", () => {
  const crudo: Record<string, number> = { "2026-07-09": 1, "2026-07-10": 11, "2026-07-11": 8 };
  it.each(Object.keys(crudo))("Dropi crudo %s", (k) => {
    expect(C[k].dropi).toBe(crudo[k]);
  });
});

describe("3b. El reparto del fin de semana (bloque incompleto)", () => {
  it("el rango va del 09 al 11 de julio (hasta el último día con datos)", () => {
    expect(dias).toEqual(["2026-07-09", "2026-07-10", "2026-07-11"]);
  });
  it("el domingo 12 todavía no existe", () => {
    expect(C["2026-07-12"]).toBeUndefined();
  });
  it("las 8 del sábado se quedan en el sábado mientras no exista el resto del bloque", () => {
    expect(C["2026-07-11"].repD).toBe(8);
  });
  it("repartir no cambia el total del periodo", () => {
    expect(sum((v) => v.repD)).toBe(sum((v) => v.dropi));
  });
  it("el sábado 11-jul se marca no laborable", () => {
    expect(C["2026-07-11"].motivo).toBeTruthy();
  });
  it("el lunes 13-jul es festivo (Virgen de Chiquinquirá)", () => {
    expect(festivosColombia(2026)["2026-07-13"]).toBe("Virgen de Chiquinquirá");
  });
});

describe("3c. El reparto SÍ funciona cuando el bloque está completo", () => {
  it("8 entre sáb/dom/lun → 2 / 2 / 4 (sobrante al lunes festivo)", () => {
    const dropiMas = leer(F_DROPI).concat([
      { FECHA: "14-07-2026", HORA: "10:00", ESTATUS: "ENTREGADO", CANTIDAD: 1, TIENDA: "Tiko" } as FilaExcel,
    ]);
    const listaEstatus = identificar(dropiMas, "ESTATUS", "CANTIDAD", APAGADO_DROPI, "(sin estatus)");
    const R2 = calcular({
      filasDropi: dropiMas,
      filasEffi: [],
      listaEstatus,
      listaVend: [],
      descartarNovedad: true,
      diasManuales: {},
    });
    expect(R2.dias["2026-07-11"].repD).toBe(2);
    expect(R2.dias["2026-07-12"].repD).toBe(2);
    expect(R2.dias["2026-07-13"].repD).toBe(4);
    const suma = ["2026-07-11", "2026-07-12", "2026-07-13"].reduce((a, k) => a + R2.dias[k].repD, 0);
    expect(suma).toBe(8);
  });
});

describe("3d. La tienda líder", () => {
  it("es Tiko con 9", () => {
    const top = Object.keys(R.porTienda).sort((a, b) => R.porTienda[b] - R.porTienda[a])[0];
    expect(top).toBe("Tiko");
    expect(R.porTienda[top]).toBe(9);
  });
});

describe("4. Combinado por día", () => {
  it("10-jul combinado = 109 (98 propias + 11 Dropi)", () => {
    expect(C["2026-07-10"].propias + C["2026-07-10"].dropi).toBe(109);
  });
  it("el último día con datos es 2026-07-11", () => {
    expect(dias[dias.length - 1]).toBe("2026-07-11");
  });
  it("11-jul combinado = 8 (solo Dropi)", () => {
    expect(C["2026-07-11"].propias + C["2026-07-11"].dropi).toBe(8);
  });
});

describe("6. El desglose cuadra con el total (nada se pierde)", () => {
  it.each(["2026-07-09", "2026-07-10", "2026-07-11"])("%s: detalle por vendedor y tienda cuadra", (k) => {
    const v = C[k];
    const sv = Object.values(v.ven).reduce((a, x) => a + x, 0);
    const st = Object.values(v.tie).reduce((a, x) => a + x, 0);
    expect(sv).toBe(v.propias);
    expect(st).toBe(v.dropi);
  });
});
