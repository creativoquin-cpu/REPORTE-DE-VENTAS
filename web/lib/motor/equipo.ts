/**
 * Resumen público del equipo para un mes: KPIs, reparto de fin de semana,
 * meta del periodo y datos de la gráfica. Portado 1:1 de pintarVendedorPublico()
 * de index.html:302-387 — la MISMA lógica que ya sirve la página pública viva.
 *
 * Es una función PURA (sin DOM, sin fetch, sin `new Date()`): recibe las
 * jornadas ya filtradas al mes, el historial de metas, los días marcados a mano
 * y la clave de "hoy". pruebas/test-vendedor-publico.js fija los números de
 * referencia; equipo.test.ts los reproduce.
 *
 * Trabaja sobre jornadas YA agregadas (fecha → propias), no sobre el Excel
 * crudo — por eso no reusa calcular.ts. El total y el ranking nunca exponen
 * cifras por vendedor (docs/BUSINESS-RULES.md regla 9).
 */
import { armarBloques, repartir } from "./reparto";
import { metaEn, type MetaHistorial } from "./metas";

/** Lo que un visitante sin sesión puede leer de una jornada. */
export interface JornadaPublicaDia {
  propias: number;
  cerrada: boolean;
  /** timestamptz de la última subida; solo se usa para el aviso de bosquejo. */
  actualizado?: string | null;
}

export interface ResumenEquipo {
  /** Claves "YYYY-MM-DD" del mes, ordenadas. */
  claves: string[];
  /** Suma de propias crudas del mes (igual a la suma repartida). */
  total: number;
  /** Promedio por día, redondeado. */
  promedio: number;
  /** Días cuyo valor repartido alcanzó la meta de propias de ese día. */
  diasEnMeta: number;
  /** Mejor día por valor repartido, o null si no hay datos. */
  mejor: { clave: string; valor: number } | null;
  /** Meta de propias vigente hoy (para el pie del KPI de promedio). */
  metaHoyPropias: number;
  /** Propias por día tras repartir el fin de semana/festivos (alineado con `claves`). */
  porDia: number[];
  /** Meta de propias por día (alineado con `claves`). */
  metaPorDia: number[];
  /** Suma de las metas diarias del mes. */
  metaPeriodo: number;
  /** Claves de días aún sin cerrar (bosquejo). */
  abiertas: string[];
  /** timestamptz más reciente entre las jornadas abiertas, o null. */
  ultimaSubida: string | null;
}

export function resumenEquipo(
  jornadasDelMes: Record<string, JornadaPublicaDia>,
  metas: MetaHistorial[],
  diasManuales: Record<string, unknown>,
  hoyClave: string
): ResumenEquipo {
  const claves = Object.keys(jornadasDelMes).sort();

  const eqDia: Record<string, number> = {};
  const eqRep: Record<string, number> = {};
  claves.forEach((k) => {
    eqDia[k] = jornadasDelMes[k].propias;
    eqRep[k] = jornadasDelMes[k].propias;
  });

  // Reparto de bloques de fin de semana/festivos (mismo criterio que el admin).
  armarBloques(claves, diasManuales).forEach((b) => {
    let suma = 0;
    b.dias.forEach((k) => (suma += eqDia[k]));
    const r = repartir(suma, b.dias.length);
    b.dias.forEach((k, i) => (eqRep[k] = r[i]));
  });

  const metaPorDia = claves.map((k) => metaEn(k, metas).propias);
  let diasEnMeta = 0;
  claves.forEach((k, i) => {
    if (eqRep[k] >= metaPorDia[i]) diasEnMeta++;
  });

  const n = claves.length;
  const total = claves.reduce((a, k) => a + eqDia[k], 0);
  const promedio = n ? Math.round(total / n) : 0;
  const metaHoyPropias = metaEn(hoyClave, metas).propias;

  let mejor: { clave: string; valor: number } | null = null;
  claves.forEach((k) => {
    if (!mejor || eqRep[k] > mejor.valor) mejor = { clave: k, valor: eqRep[k] };
  });

  const abiertas = claves.filter((k) => !jornadasDelMes[k].cerrada);
  let ultimaSubida: string | null = null;
  abiertas.forEach((k) => {
    const a = jornadasDelMes[k].actualizado;
    if (a && (!ultimaSubida || a > ultimaSubida)) ultimaSubida = a;
  });

  const metaPeriodo = metaPorDia.reduce((a, m) => a + m, 0);
  const porDia = claves.map((k) => eqRep[k]);

  return {
    claves,
    total,
    promedio,
    diasEnMeta,
    mejor,
    metaHoyPropias,
    porDia,
    metaPorDia,
    metaPeriodo,
    abiertas,
    ultimaSubida,
  };
}
