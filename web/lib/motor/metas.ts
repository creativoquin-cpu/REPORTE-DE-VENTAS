import type { Meta } from "@/types/database";

/**
 * Resolución de la meta vigente para una fecha, a partir del historial
 * versionado (nunca se edita/borra una fila). Portado 1:1 desde
 * quin-admin.html:440-452. Ver docs/BUSINESS-RULES.md regla 6.
 *
 * La meta de un día es la última fila cuyo `desde` ya llegó; ante empate de
 * fecha, gana la registrada después (mayor `id`).
 */

export const META_TOTAL_POR_DEFECTO = 200;
export const META_PROPIAS_POR_DEFECTO = 160;

/** Meta resuelta para un día: solo los dos números que consume el motor. */
export interface MetaVigente {
  total: number;
  propias: number;
  /** Fecha "desde" de la fila que ganó, o null si se usó el valor de arranque. */
  desde: string | null;
}

/** Ordena el historial por `desde` y, ante empate, por `id`. quin-admin.html:440 */
export function metasOrden(historial: Meta[]): Meta[] {
  return historial.slice().sort((a, b) => {
    if (a.desde !== b.desde) return a.desde < b.desde ? -1 : 1;
    return a.id - b.id; // misma fecha: manda la registrada después
  });
}

/** Meta vigente para la clave "YYYY-MM-DD" dada. quin-admin.html:446 */
export function metaEn(claveFecha: string, historial: Meta[]): MetaVigente {
  let r: MetaVigente = {
    total: META_TOTAL_POR_DEFECTO,
    propias: META_PROPIAS_POR_DEFECTO,
    desde: null,
  };
  metasOrden(historial).forEach((m) => {
    if (m.desde <= claveFecha) r = { total: m.total, propias: m.propias, desde: m.desde };
  });
  return r;
}
