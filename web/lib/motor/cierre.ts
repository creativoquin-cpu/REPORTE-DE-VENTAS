/**
 * Lógica pura del cierre mensual. Puerto de estadoMes()
 * (quin-admin.html:1233-1238), resumenMes() (1168-1189) y las transiciones
 * cerrarMesAMano()/reabrirMes() (1212-1232). La capa que ESCRIBE a Supabase
 * vive en lib/data/; acá solo el cálculo, puro y testeable.
 *
 * Funciones puras: el "mes de hoy" y el sello de tiempo entran como parámetros
 * (`mesActual`, `hoyTxt`), no se llama a `new Date()` acá — igual criterio que
 * lib/motor/equipo.ts.
 */
import { metaEn, type MetaHistorial } from "./metas";
import type { ResumenMes, MesCerradoDatos } from "@/types/database";

/** Lo mínimo de una jornada cerrada para sumar el mes. */
export interface JornadaSumable {
  propias: number;
  dropi: number;
}

export type EstadoMes = "cerrado" | "reabierto" | "en curso" | "pendiente";

/** "YYYY-MM-DD" → "YYYY-MM". */
export function mesDeClave(clave: string): string {
  return clave.slice(0, 7);
}

/**
 * Estado de un mes según su sello y el mes en curso. Un mes con sello
 * "abierto" fue reabierto a mano y no se vuelve a cerrar solo.
 */
export function estadoMes(
  mes: string,
  sello: { estado: "cerrado" | "abierto" } | undefined | null,
  mesActual: string
): EstadoMes {
  if (sello && sello.estado === "cerrado") return "cerrado";
  if (sello) return "reabierto";
  return mes < mesActual ? "pendiente" : "en curso";
}

/**
 * Suma de las jornadas CERRADAS de un mes (lo oficial, nunca el bosquejo).
 * `jornadas` va indexado por clave "YYYY-MM-DD" y se asume que solo contiene
 * días cerrados (así se carga en la app nueva).
 */
export function resumenMensualCerrado(
  jornadas: Record<string, JornadaSumable>,
  mes: string
): { dias: number; total: number; p: number; d: number } {
  let dias = 0;
  let p = 0;
  let d = 0;
  Object.keys(jornadas).forEach((k) => {
    if (mesDeClave(k) !== mes) return;
    dias++;
    p += jornadas[k].propias;
    d += jornadas[k].dropi;
  });
  return { dias, total: p + d, p, d };
}

/** Una jornada cerrada con su detalle, para armar el resumen sellado. */
export interface JornadaResumible {
  propias: number;
  dropi: number;
  ven: Record<string, number>;
  tie: Record<string, number>;
}

/**
 * Resumen sellado de un mes: totales, promedio, mejor/peor día, detalle por
 * vendedor/tienda y cuántos días llegaron a la meta. Puerto de resumenMes()
 * (quin-admin.html:1168-1189). Suma SOLO las jornadas cerradas (nunca el
 * bosquejo) y usa la meta vigente de cada día (sin reparto de fin de semana,
 * igual que el original). `metas` es el historial completo.
 */
export function resumenMes(
  jornadas: Record<string, JornadaResumible>,
  metas: MetaHistorial[],
  mes: string
): ResumenMes {
  const claves = Object.keys(jornadas)
    .filter((k) => mesDeClave(k) === mes)
    .sort();
  let p = 0;
  let d = 0;
  const ven: Record<string, number> = {};
  const tie: Record<string, number> = {};
  let mejor: { k: string; t: number } | null = null;
  let peor: { k: string; t: number } | null = null;
  let enMetaT = 0;
  let enMetaP = 0;
  let sinDetalle = 0;

  claves.forEach((k) => {
    const o = jornadas[k];
    const t = o.propias + o.dropi;
    p += o.propias;
    d += o.dropi;
    if (Object.keys(o.ven).length === 0 && Object.keys(o.tie).length === 0) sinDetalle++;
    Object.keys(o.ven).forEach((v) => (ven[v] = (ven[v] || 0) + o.ven[v]));
    Object.keys(o.tie).forEach((x) => (tie[x] = (tie[x] || 0) + o.tie[x]));
    if (!mejor || t > mejor.t) mejor = { k, t };
    if (!peor || t < peor.t) peor = { k, t };
    const M = metaEn(k, metas);
    if (t >= M.total) enMetaT++;
    if (o.propias >= M.propias) enMetaP++;
  });

  const n = claves.length;
  const total = p + d;
  return {
    dias: n,
    total,
    p,
    d,
    prom: n ? Math.round(total / n) : 0,
    pct: total ? Math.round((p * 100) / total) : 0,
    mejor,
    peor,
    ven,
    tie,
    enMetaT,
    enMetaP,
    sinDetalle,
  };
}

/**
 * Sella (cierra) un mes a mano: produce los `datos` nuevos del sello con el
 * resumen congelado y la traza actualizada. Puerto de cerrarMesAMano()
 * (quin-admin.html:1212-1223). No escribe: devuelve el objeto a guardar.
 */
export function sellarMes(
  previo: MesCerradoDatos | null,
  resumen: ResumenMes,
  hoyTxt: string
): MesCerradoDatos {
  const reCierre = (previo?.traza?.length ?? 0) > 0;
  return {
    estado: "cerrado",
    cerrado: hoyTxt,
    auto: false,
    resumen,
    traza: [
      ...(previo?.traza ?? []),
      {
        que: reCierre ? "Vuelto a cerrar a mano" : "Cerrado a mano",
        cuando: hoyTxt,
        quien: "Administrador",
        total: resumen.total,
      },
    ],
  };
}

/**
 * Reabre un mes: quita el sello (estado "abierto") y registra el evento.
 * Puerto de reabrirMes() (quin-admin.html:1224-1232). El resumen previo se
 * conserva como referencia.
 */
export function reabrirMesDatos(previo: MesCerradoDatos, hoyTxt: string): MesCerradoDatos {
  const antes = previo.resumen ? previo.resumen.total : null;
  return {
    ...previo,
    estado: "abierto",
    cerrado: null,
    auto: false,
    traza: [
      ...(previo.traza ?? []),
      { que: "Reabierto", cuando: hoyTxt, quien: "Administrador", total: antes },
    ],
  };
}
