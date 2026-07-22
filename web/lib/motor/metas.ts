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

/**
 * Campos mínimos de una fila de meta que consume el cálculo. La vista pública
 * solo lee `id,desde,total,propias` de la nube; el panel admin pasa `Meta`
 * completo. Ambos satisfacen este tipo.
 */
export type MetaHistorial = Pick<Meta, "id" | "desde" | "total" | "propias">;

/** Meta resuelta para un día: solo los dos números que consume el motor. */
export interface MetaVigente {
  total: number;
  propias: number;
  /** Fecha "desde" de la fila que ganó, o null si se usó el valor de arranque. */
  desde: string | null;
}

/** Ordena el historial por `desde` y, ante empate, por `id`. quin-admin.html:440 */
export function metasOrden<T extends MetaHistorial>(historial: T[]): T[] {
  return historial.slice().sort((a, b) => {
    if (a.desde !== b.desde) return a.desde < b.desde ? -1 : 1;
    return a.id - b.id; // misma fecha: manda la registrada después
  });
}

/** Meta vigente para la clave "YYYY-MM-DD" dada. quin-admin.html:446 */
export function metaEn(claveFecha: string, historial: MetaHistorial[]): MetaVigente {
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

/**
 * Valida una meta nueva antes de guardarla. Devuelve el texto del error o null
 * si es válida. Puerto de metaGuardarClic() (quin-admin.html:1431-1443): la
 * fecha es obligatoria, total > 0, propias >= 0 y <= total, y no puede ser
 * idéntica a la que ya rige desde esa fecha.
 */
export function validarMeta(
  historial: MetaHistorial[],
  total: number,
  propias: number,
  desde: string
): string | null {
  if (!desde) return "Falta la fecha desde la que aplica.";
  if (!(total > 0)) return "La meta total tiene que ser un número mayor que cero.";
  if (!(propias >= 0)) return "La meta de propias no puede ser negativa.";
  if (propias > total) return "La meta de propias no puede ser mayor que la total.";
  const ant = metaEn(desde, historial);
  if (ant.total === total && ant.propias === propias)
    return "Esa ya es la meta que rige desde esa fecha. No hay nada que cambiar.";
  return null;
}
