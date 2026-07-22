/**
 * Cálculos PUROS de lo que se escribe a la nube al cerrar jornadas: la fila de
 * `jornadas` que resulta de cerrar un día y las filas de `ranking_publico`.
 * Portado de cerrarJornadas() (quin-admin.html:1118-1134) y filasRankingPublico()
 * (1727-1744). Sin Supabase, sin DOM y sin `new Date()` — el "ahora" y el texto
 * de cierre entran como parámetros para que sea testeable y determinista.
 *
 * La CAPA que ejecuta el upsert/delete vive aparte (lib/data/*), con mutaciones
 * puntuales por día/mes — no el patrón "subir tabla y borrar lo que falta".
 */
import type { Jornada, RankingPublicoEntry } from "@/types/database";

/** Lo que aporta el cálculo del Excel para un día (subconjunto de DiaCalculado). */
export interface CifraDia {
  propias: number;
  dropi: number;
  ven: Record<string, number>;
  tie: Record<string, number>;
}

/**
 * Fila de `jornadas` al cerrar el día `fecha`. Si no había jornada, nace la
 * oficial. Si ya existía, lo OFICIAL se respeta y la cifra nueva se guarda solo
 * como "foto" de comparación (regla del app viejo: cerrar de nuevo no pisa la
 * cifra oficial). Devuelve también si es nueva, para el resumen del cierre.
 */
export function filaCierreJornada(
  fecha: string,
  cifra: CifraDia,
  existente: Jornada | null | undefined,
  cerradaTexto: string,
  ahoraISO: string
): { fila: Jornada; esNueva: boolean } {
  if (!existente) {
    return {
      esNueva: true,
      fila: {
        fecha,
        propias: cifra.propias,
        dropi: cifra.dropi,
        ven: cifra.ven ?? {},
        tie: cifra.tie ?? {},
        cerrada: true,
        cerrada_el: cerradaTexto,
        fotos: [],
        actualizado: ahoraISO,
      },
    };
  }
  return {
    esNueva: false,
    fila: {
      ...existente,
      cerrada: true,
      fotos: [...existente.fotos, { cuando: cerradaTexto, p: cifra.propias, d: cifra.dropi }],
      actualizado: ahoraISO,
    },
  };
}

/** Resumen en texto de cuántas jornadas se cerraron/actualizaron. */
export function resumenCierre(nuevas: number, actualizadas: number): string {
  const p: string[] = [];
  if (nuevas) p.push(`cerré ${nuevas} jornada${nuevas > 1 ? "s" : ""} nueva${nuevas > 1 ? "s" : ""}`);
  if (actualizadas)
    p.push(`actualicé el comparativo de ${actualizadas} ya cerrada${actualizadas > 1 ? "s" : ""}`);
  return p.length ? p.join(" y ") + "." : "No había nada que cerrar.";
}

/** Solo el detalle por vendedor de un día (lo que alimenta el ranking). */
export interface VenDia {
  ven: Record<string, number>;
}

/**
 * Filas de `ranking_publico` del mes: SOLO puesto y nombre, ninguna cifra
 * (regla 9). Suma el detalle por vendedor de las jornadas oficiales del mes y,
 * para los días aún sin cerrar (bosquejo), también los suma salvo que ese día
 * ya esté cerrado (ahí manda lo oficial). Empates: por nombre ascendente.
 */
export function rankingPublico(
  oficiales: Record<string, VenDia>,
  borradores: Record<string, VenDia>,
  mes: string
): RankingPublicoEntry[] {
  const ac: Record<string, number> = {};
  Object.keys(oficiales).forEach((k) => {
    if (k.slice(0, 7) !== mes) return;
    const ven = oficiales[k].ven || {};
    Object.keys(ven).forEach((v) => (ac[v] = (ac[v] || 0) + ven[v]));
  });
  Object.keys(borradores).forEach((k) => {
    if (k.slice(0, 7) !== mes || oficiales[k]) return;
    const ven = borradores[k].ven || {};
    Object.keys(ven).forEach((v) => (ac[v] = (ac[v] || 0) + ven[v]));
  });
  return Object.keys(ac)
    .map((nom) => ({ nom, n: ac[nom] }))
    .sort((a, b) => b.n - a.n || (a.nom < b.nom ? -1 : 1))
    .map((x, i) => ({ mes, puesto: i + 1, nombre: x.nom }));
}

/** El ranking de un mes que hay que reemplazar (borrar e insertar). */
export interface RankingReemplazo {
  mes: string;
  filas: RankingPublicoEntry[];
}

/**
 * Plan completo de un cierre: las filas de `jornadas` a hacer upsert y, por
 * cada mes tocado, las filas de `ranking_publico` que lo reemplazan. Es lo que
 * la vista previa muestra y lo que la capa de datos ejecuta — nada más.
 */
export interface PlanCierre {
  jornadas: Jornada[];
  ranking: RankingReemplazo[];
  resumen: string;
  nuevas: number;
  actualizadas: number;
}

/**
 * Arma el plan de cierre para los días seleccionados: función PURA, no toca
 * Supabase. Recalcula el ranking de cada mes tocado a partir del estado oficial
 * resultante (jornadas ya cerradas + las que se cierran ahora) más el bosquejo
 * de los días que siguen sin cerrar.
 */
export function planificarCierre(
  seleccion: string[],
  cifras: Record<string, CifraDia>,
  jornadas: Record<string, Jornada>,
  cerradaTexto: string,
  ahoraISO: string
): PlanCierre {
  const filas: Jornada[] = [];
  let nuevas = 0;
  let actualizadas = 0;
  seleccion.forEach((k) => {
    const c = cifras[k];
    if (!c) return;
    const { fila, esNueva } = filaCierreJornada(k, c, jornadas[k], cerradaTexto, ahoraISO);
    filas.push(fila);
    if (esNueva) nuevas++;
    else actualizadas++;
  });

  // Estado oficial resultante (lo ya cerrado + lo que se cierra ahora).
  const oficiales: Record<string, VenDia> = {};
  Object.keys(jornadas).forEach((k) => (oficiales[k] = { ven: jornadas[k].ven }));
  filas.forEach((f) => (oficiales[f.fecha] = { ven: f.ven }));
  // Bosquejo: días con cifra que siguen sin cerrar.
  const borradores: Record<string, VenDia> = {};
  Object.keys(cifras).forEach((k) => {
    if (!oficiales[k]) borradores[k] = { ven: cifras[k].ven };
  });

  const meses = [...new Set(filas.map((f) => f.fecha.slice(0, 7)))];
  const ranking = meses.map((mes) => ({ mes, filas: rankingPublico(oficiales, borradores, mes) }));

  return { jornadas: filas, ranking, resumen: resumenCierre(nuevas, actualizadas), nuevas, actualizadas };
}

/** Qué cambia al reabrir una jornada: se borra ese día y se recalcula su mes. */
export interface PlanReapertura {
  fecha: string;
  ranking: RankingReemplazo[];
}

/**
 * Plan de reapertura de un día: la jornada oficial se quita y el ranking del
 * mes se recalcula sin ella (si el día sigue en el Excel, vuelve a contar como
 * bosquejo; si no, desaparece). PURA, no toca Supabase.
 */
export function planificarReapertura(
  fecha: string,
  jornadas: Record<string, Jornada>,
  cifras: Record<string, CifraDia>
): PlanReapertura {
  const mes = fecha.slice(0, 7);
  const oficiales: Record<string, VenDia> = {};
  Object.keys(jornadas).forEach((k) => {
    if (k !== fecha) oficiales[k] = { ven: jornadas[k].ven };
  });
  const borradores: Record<string, VenDia> = {};
  Object.keys(cifras).forEach((k) => {
    if (!oficiales[k]) borradores[k] = { ven: cifras[k].ven };
  });
  return { fecha, ranking: [{ mes, filas: rankingPublico(oficiales, borradores, mes) }] };
}
