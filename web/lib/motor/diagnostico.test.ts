import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import { calcular, type EntradaCalculo } from "./calcular";
import { diagnosticar, type Diagnostico } from "./diagnostico";
import { identificar, APAGADO_DROPI, APAGADO_EFFI, type FilaExcel } from "./filtros";

/**
 * El diagnóstico ("Qué se descartó") debe cuadrar fila por fila con calcular():
 * lo que cuenta acá es exactamente lo que suma allá. Mismos Excel reales del
 * repo y mismos números de referencia del §17 (98 propias, 20 Dropi).
 */
const RAIZ = path.resolve(process.cwd(), "..");
const F_EFFI = "Reporte de conceptos de remisiones de venta 2026-07-12.xlsx";
const F_DROPI = "ordenes_productos_20260712_111712.xlsx";

function leer(archivo: string): FilaExcel[] {
  const libro = XLSX.read(fs.readFileSync(path.join(RAIZ, archivo)), {
    type: "buffer",
    cellDates: true,
  });
  return XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { defval: null }) as FilaExcel[];
}

let filasEffi: FilaExcel[];
let filasDropi: FilaExcel[];
let entrada: EntradaCalculo;
let D: Diagnostico;

beforeAll(() => {
  filasEffi = leer(F_EFFI);
  filasDropi = leer(F_DROPI);
  entrada = {
    filasDropi,
    filasEffi,
    listaEstatus: identificar(filasDropi, "ESTATUS", "CANTIDAD", APAGADO_DROPI, "(sin estatus)"),
    listaVend: identificar(filasEffi, "Vendedor", "Cantidad", APAGADO_EFFI, "(sin vendedor)"),
    descartarNovedad: true,
    diasManuales: {},
  };
  D = diagnosticar(entrada);
});

const sumar = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);

describe("diagnostico contra los Excel reales", () => {
  it("hay una fila de detalle por cada fila cruda de cada archivo", () => {
    expect(D.detalleDropi.length).toBe(filasDropi.length);
    expect(D.detalleEffi.length).toBe(filasEffi.length);
  });

  it("lo contado cuadra con los números de referencia del §17", () => {
    expect(D.contadasEffi).toBe(98);
    expect(D.contadasDropi).toBe(20);
  });

  it("contado + descartado = total de unidades crudas de cada archivo", () => {
    const crudasDropi = filasDropi.reduce((a, r) => a + Number(r["CANTIDAD"] ?? 0), 0);
    const crudasEffi = filasEffi.reduce((a, r) => a + Number(r["Cantidad"] ?? 0), 0);
    expect(D.contadasDropi + D.descartadasDropi).toBe(crudasDropi);
    expect(D.contadasEffi + D.descartadasEffi).toBe(crudasEffi);
  });

  it("lo contado en el diagnóstico = lo que calcular() suma en el periodo", () => {
    const R = calcular(entrada);
    expect(D.contadasEffi).toBe(sumar(R.porVendedorEffi));
    expect(D.contadasDropi).toBe(sumar(R.porTienda));
  });

  it("los totales salen de sumar las filas por su veredicto", () => {
    const suma = (fs: { cant: number; motivo: string | null }[], descartada: boolean) =>
      fs.filter((f) => !!f.motivo === descartada).reduce((a, f) => a + f.cant, 0);
    expect(suma(D.detalleDropi, false)).toBe(D.contadasDropi);
    expect(suma(D.detalleDropi, true)).toBe(D.descartadasDropi);
    expect(suma(D.detalleEffi, false)).toBe(D.contadasEffi);
    expect(suma(D.detalleEffi, true)).toBe(D.descartadasEffi);
    // Effi: una unidad descartada (99 crudas → 98 contadas).
    expect(D.descartadasEffi).toBe(1);
  });
});
