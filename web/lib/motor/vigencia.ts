/**
 * Vigencia de remisiones de Effi (columna "Vigencia" del Excel nuevo).
 *
 * Regla de negocio: una remisión "anulada" NO es venta real (el cliente canceló,
 * no hay cobertura, cambio de color, etc.). La venta REAL son solo las vigentes;
 * la venta OFICIAL/bruta es todo lo remitido (vigentes + anuladas). La diferencia
 * entre ambas son las anuladas, con su motivo (columna "Observación anulación").
 *
 * Archivos viejos sin columna "Vigencia": todo cuenta como vigente, así que el
 * comportamiento previo no cambia.
 */
import { aNumero } from "./fechas";
import type { FilaExcel } from "./filtros";

/** Una fila de remisión está anulada si su Vigencia contiene "anulad". */
export function esAnulada(fila: FilaExcel): boolean {
  const v = String(fila["Vigencia"] == null ? "" : fila["Vigencia"]).trim().toLowerCase();
  return v.includes("anulad");
}

/** Motivo de anulación de una fila, o "(sin motivo)" si viene vacío. */
export function motivoAnulacion(fila: FilaExcel): string {
  const m = fila["Observación anulación"] ?? fila["Observacion anulacion"];
  const s = String(m == null ? "" : m).trim();
  return s || "(sin motivo)";
}

export interface ResumenVigencia {
  /** Venta oficial/bruta: todo lo remitido (vigentes + anuladas). */
  remitido: number;
  /** Venta real: solo prendas de remisiones vigentes. */
  real: number;
  /** Prendas anuladas (remitido − real). */
  anuladas: number;
  /** Cantidad de remisiones (filas) anuladas. */
  filasAnuladas: number;
  /** Motivos de anulación agrupados por prendas, de mayor a menor. */
  motivos: Array<{ motivo: string; cantidad: number }>;
}

/**
 * Resume un archivo de Effi en venta real vs oficial y el detalle de anuladas.
 * Mira el archivo tal cual (sin filtros de vendedor): describe lo que se subió.
 */
export function resumenVigencia(filasEffi: FilaExcel[] | null): ResumenVigencia {
  let remitido = 0;
  let anuladas = 0;
  let filasAnuladas = 0;
  const motivos = new Map<string, number>();

  (filasEffi || []).forEach((r) => {
    const cant = aNumero(r["Cantidad"]);
    remitido += cant;
    if (esAnulada(r)) {
      anuladas += cant;
      filasAnuladas += 1;
      const m = motivoAnulacion(r);
      motivos.set(m, (motivos.get(m) || 0) + cant);
    }
  });

  return {
    remitido,
    real: remitido - anuladas,
    anuladas,
    filasAnuladas,
    motivos: [...motivos.entries()]
      .map(([motivo, cantidad]) => ({ motivo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad),
  };
}
