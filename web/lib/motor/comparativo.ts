/**
 * Comparativo entre meses (Fase 7). Puerto PURO del BLOQUE 7 de la app vieja
 * (quin-admin.html:2455-2510): resumen por mes, corte común de días, deltas
 * mes contra mes, "top" del mes y las tablas de personas mes a mes.
 *
 * Como el resto del motor: sin DOM, sin fetch, sin `new Date()` — los datos del
 * mes entran ya armados con datosDelMes() (ver ./tablero.ts).
 */
import { SIN_TIENDA } from "./filtros";
import { mesDeClave, resumenMensualCerrado, type JornadaSumable } from "./cierre";
import type { DiaTablero, JornadaTablero, CifraTablero } from "./tablero";
import type { MesCerradoDatos } from "@/types/database";

/** Resumen de un mes para la tabla comparativa. */
export interface ResumenCmp {
  mes: string;
  /** Días con dato considerados (ya recortados por el corte común, si lo hay). */
  n: number;
  p: number;
  d: number;
  total: number;
  /** Días incluidos que están sin cerrar (bosquejo). */
  abiertas: number;
  prom: number;
  pct: number;
  mejor: { k: string; t: number } | null;
  peor: { k: string; t: number } | null;
  ven: Record<string, number>;
  tie: Record<string, number>;
}

/**
 * Resume un mes ya armado con datosDelMes(). `limite` = cuántos de los primeros
 * días con datos tomar (0 = el mes entero), para poder comparar "los primeros N
 * días" de cada mes y que el mes en curso no salga castigado.
 */
export function resumenCmp(
  mes: string,
  D: Record<string, DiaTablero>,
  limite: number
): ResumenCmp {
  let claves = Object.keys(D).sort();
  if (limite) claves = claves.slice(0, limite);

  let p = 0;
  let d = 0;
  let abiertas = 0;
  let mejor: { k: string; t: number } | null = null;
  let peor: { k: string; t: number } | null = null;
  const ven: Record<string, number> = {};
  const tie: Record<string, number> = {};

  claves.forEach((k) => {
    const o = D[k];
    const t = o.p + o.d;
    p += o.p;
    d += o.d;
    if (!o.cerrada) abiertas++;
    if (!mejor || t > mejor.t) mejor = { k, t };
    if (!peor || t < peor.t) peor = { k, t };
    Object.keys(o.ven).forEach((x) => (ven[x] = (ven[x] || 0) + o.ven[x]));
    Object.keys(o.tie).forEach((x) => (tie[x] = (tie[x] || 0) + o.tie[x]));
  });

  const n = claves.length;
  const total = p + d;
  return {
    mes,
    n,
    p,
    d,
    total,
    abiertas,
    prom: n ? Math.round(total / n) : 0,
    pct: total ? Math.round((p * 100) / total) : 0,
    mejor,
    peor,
    ven,
    tie,
  };
}

/**
 * Corte común: el menor número de días con datos entre los meses dados, para
 * comparar "los primeros N días" de cada uno. Devuelve 0 (= sin corte) si hay
 * un solo mes o si ninguno tiene datos. Puerto de pintarComparativo()
 * (quin-admin.html:2520-2528).
 */
export function corteComun(diasPorMes: number[]): number {
  if (diasPorMes.length < 2) return 0;
  const conDatos = diasPorMes.filter((n) => n > 0);
  return conDatos.length ? Math.min(...conDatos) : 0;
}

/** Diferencia contra el mes anterior. `null` = no hay con qué comparar. */
export interface Delta {
  dif: number;
  /** % sobre el mes anterior; 0 si el anterior era 0. */
  pct: number;
}

/** Puerto de cmpDelta() (quin-admin.html:2479-2487), sin el HTML. */
export function delta(act: number, ant: number | null): Delta | null {
  if (ant == null) return null;
  const dif = act - ant;
  return { dif, pct: ant ? Math.round((Math.abs(dif) * 100) / ant) : 0 };
}

/** El primero del mapa, ignorando el cubo "sin tienda". Puerto de cmpTop(). */
export function topCmp(mapa: Record<string, number>): { nombre: string; n: number } | null {
  const orden = Object.keys(mapa)
    .filter((x) => x !== SIN_TIENDA)
    .sort((a, b) => mapa[b] - mapa[a] || (a < b ? -1 : 1));
  return orden.length ? { nombre: orden[0], n: mapa[orden[0]] } : null;
}

/** Una fila de la tabla "persona mes a mes". */
export interface FilaPersona {
  nombre: string;
  /** Un valor por mes, alineado con los resúmenes recibidos. */
  serie: number[];
  total: number;
  /** Último mes contra el anterior (null si hay un solo mes). */
  delta: Delta | null;
}

/**
 * Tabla de personas mes a mes: acumula el detalle de `campo` ("ven" o "tie") de
 * cada mes y ordena por total desc. Puerto de cmpTablaPersonas()
 * (quin-admin.html:2493-2510).
 */
export function tablaPersonas(resumenes: ResumenCmp[], campo: "ven" | "tie"): FilaPersona[] {
  const totales: Record<string, number> = {};
  resumenes.forEach((r) => {
    Object.keys(r[campo]).forEach((x) => (totales[x] = (totales[x] || 0) + r[campo][x]));
  });
  return Object.keys(totales)
    .sort((a, b) => totales[b] - totales[a] || (a < b ? -1 : 1))
    .map((nombre) => {
      const serie = resumenes.map((r) => r[campo][nombre] || 0);
      const ant = serie.length > 1 ? serie[serie.length - 2] : null;
      return {
        nombre,
        serie,
        total: totales[nombre],
        delta: delta(serie[serie.length - 1], ant),
      };
    });
}

/**
 * Meses a comparar, del más antiguo al más reciente (así los lee la tabla y la
 * gráfica). Con `incluirBosquejo` también cuenta los meses que solo existen en
 * el Excel de la sesión.
 */
export function mesesComparables(
  jornadas: Record<string, JornadaTablero>,
  calcDias: Record<string, CifraTablero>,
  incluirBosquejo: boolean
): string[] {
  const s = new Set<string>();
  Object.keys(jornadas).forEach((k) => s.add(mesDeClave(k)));
  if (incluirBosquejo) Object.keys(calcDias).forEach((k) => s.add(mesDeClave(k)));
  return [...s].sort();
}

/** Sello de un mes contra lo que suman hoy sus jornadas cerradas. */
export interface DifSellado {
  sellado: number;
  ahora: number;
  dif: number;
  diasSellados: number;
  diasAhora: number;
}

/**
 * Compara la cifra sellada de un mes con lo que suman AHORA sus jornadas
 * cerradas (nunca el bosquejo). Puerto de difMesSellado()
 * (quin-admin.html:1240-1246). `null` si el mes no está sellado.
 */
export function difSellado(
  sello: MesCerradoDatos | null | undefined,
  jornadas: Record<string, JornadaSumable>,
  mes: string
): DifSellado | null {
  if (!sello || sello.estado !== "cerrado" || !sello.resumen) return null;
  const r = resumenMensualCerrado(jornadas, mes);
  return {
    sellado: sello.resumen.total,
    ahora: r.total,
    dif: r.total - sello.resumen.total,
    diasSellados: sello.resumen.dias,
    diasAhora: r.dias,
  };
}
