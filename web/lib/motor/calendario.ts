/**
 * Calendario de exploración por fechas (Fase 6, solo lectura). Puerto PURO de
 * las utilidades de la pestaña 3 (quin-admin.html:2636-2764): datos por día
 * (cerrado u bosquejo), meses con datos, navegación por meses, marca de rango y
 * resumen de la selección. Sin DOM ni estado global.
 */
import { claveFecha, fdate } from "./fechas";
import { sumarDias } from "./festivos";

/** Cifra de un día para el calendario, o null si no hay dato. */
export interface DatoDia {
  p: number;
  d: number;
  t: number;
  cerrada: boolean;
}

export interface JornadaCal {
  propias: number;
  dropi: number;
}
export interface CifraCal {
  propias: number;
  dropi: number;
}

/** Dato de un día: la jornada cerrada manda; si no, el bosquejo del Excel. */
export function datoDia(
  k: string,
  jornadas: Record<string, JornadaCal>,
  calcDias: Record<string, CifraCal>
): DatoDia | null {
  const j = jornadas[k];
  if (j) return { p: j.propias, d: j.dropi, t: j.propias + j.dropi, cerrada: true };
  const c = calcDias[k];
  if (c) return { p: c.propias, d: c.dropi, t: c.propias + c.dropi, cerrada: false };
  return null;
}

/** Corre un mes "YYYY-MM" n posiciones (n puede ser negativo). */
export function correrMes(m: string, n: number): string {
  const [y, mm] = m.split("-").map(Number);
  const f = new Date(y, mm - 1 + n, 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
}

/** Meses con jornada cerrada o día cargado, del más reciente al más viejo. */
export function mesesConAlgo(
  jornadas: Record<string, JornadaCal>,
  calcDias: Record<string, CifraCal>
): string[] {
  const s = new Set<string>();
  Object.keys(jornadas).forEach((k) => s.add(k.slice(0, 7)));
  Object.keys(calcDias).forEach((k) => s.add(k.slice(0, 7)));
  return [...s].sort().reverse();
}

/**
 * Mes ancla inicial: el más reciente con datos queda al final de la tira de
 * `mesesVis` meses (o el mes en curso si no hay datos).
 */
export function mesInicial(
  jornadas: Record<string, JornadaCal>,
  calcDias: Record<string, CifraCal>,
  mesesVis: number,
  hoyMes: string
): string {
  const ms = mesesConAlgo(jornadas, calcDias);
  const base = ms.length ? ms[0] : hoyMes;
  return correrMes(base, -(mesesVis - 1));
}

/** Todas las claves entre dos fechas (inclusive), en orden. */
export function marcarRango(a: string, b: string): string[] {
  const ini = a < b ? a : b;
  const fin = a < b ? b : a;
  const out: string[] = [];
  let f = fdate(ini);
  const ff = fdate(fin);
  while (f <= ff) {
    out.push(claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate()));
    f = sumarDias(f, 1);
  }
  return out;
}

export interface ResumenSeleccion {
  /** Días seleccionados con jornada cerrada (los que suman). */
  n: number;
  sP: number;
  sD: number;
  sT: number;
  /** Días cargados sin cerrar (no suman). */
  pend: number;
  /** Días seleccionados sin ningún dato. */
  sinDatos: number;
  primera: string | null;
  ultima: string | null;
}

/** Resumen de la selección: suma solo lo cerrado; cuenta pend y sin datos. */
export function resumenSeleccion(
  seleccion: string[],
  jornadas: Record<string, JornadaCal>,
  calcDias: Record<string, CifraCal>
): ResumenSeleccion {
  const claves = [...seleccion].sort();
  let sP = 0;
  let sD = 0;
  let n = 0;
  let pend = 0;
  claves.forEach((k) => {
    const v = datoDia(k, jornadas, calcDias);
    if (!v) return;
    if (v.cerrada) {
      n++;
      sP += v.p;
      sD += v.d;
    } else {
      pend++;
    }
  });
  return {
    n,
    sP,
    sD,
    sT: sP + sD,
    pend,
    sinDatos: claves.length - n - pend,
    primera: claves.length ? claves[0] : null,
    ultima: claves.length ? claves[claves.length - 1] : null,
  };
}
