import type { Meta } from "@/types/database";

/**
 * Resolución de la meta vigente para una fecha, a partir del historial
 * versionado (nunca se edita/borra una fila). Ver
 * ../../docs/BUSINESS-RULES.md regla 6.
 *
 * La meta de un día es la última fila cuyo `desde` ya llegó; ante empate de
 * fecha, gana la guardada más recientemente (ver Meta.actualizado).
 *
 * TODO Fase 2: portar metaEn()/metaHoy() desde quin-admin.html:446-452 y
 * validar contra pruebas/test-metas.js.
 */
export function metaEn(_claveFecha: string, _historial: Meta[]): Pick<Meta, "total" | "propias"> {
  throw new Error("TODO Fase 2: portar metaEn() desde quin-admin.html:446");
}

export const META_TOTAL_POR_DEFECTO = 200;
export const META_PROPIAS_POR_DEFECTO = 160;
