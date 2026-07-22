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
