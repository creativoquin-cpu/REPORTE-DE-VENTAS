/**
 * Datos para la imagen de WhatsApp (Fase 9). Puerto PURO de mesImagen() e
 * imgDatos() (quin-admin.html:2167-2212): arma el informe del DÍA (el último
 * cargado) con las barras REPARTIDAS del mes, las metas por día y los totales.
 *
 * Solo el cálculo, sin canvas: el dibujo vive en lib/imagen/dibujar.ts. Como el
 * resto del motor, sin DOM y con el "hoy" como parámetro.
 */
import { armarBloques, repartir } from "./reparto";
import { metaEn, type MetaHistorial } from "./metas";
import { datosDelMes, type JornadaTablero, type CifraTablero } from "./tablero";

/** El informe completo de la imagen para un mes. */
export interface DatosImagen {
  m: string;
  claves: string[];
  /** Total repartido por día. */
  rep: Record<string, number>;
  /** Propias repartidas por día. */
  repP: Record<string, number>;
  /** Dropi repartido por día. */
  repD: Record<string, number>;
  /** Meta total por día, alineada con `claves`. */
  metas: number[];
  /** Meta de propias por día, alineada con `claves`. */
  metasP: number[];
  total: number;
  totalP: number;
  n: number;
  prom: number;
  promP: number;
  enMeta: number;
  enMetaP: number;
  /** El día que se reporta: el último con datos. */
  dia: string;
  diaTotal: number;
  diaP: number;
  diaD: number;
  metaDia: number;
  metaDiaP: number;
  /** Días incluidos que aún no están cerrados (bosquejo). */
  sinCerrar: number;
}

/**
 * Mes de la imagen: el del último día del Excel cargado en la sesión; si no hay
 * archivo, el mes en curso. NO depende del selector del tablero. Puerto de
 * mesImagen() (quin-admin.html:2167-2171).
 */
export function mesImagen(calcDias: Record<string, CifraTablero>, hoyMes: string): string {
  const ks = Object.keys(calcDias).sort();
  return ks.length ? ks[ks.length - 1].slice(0, 7) : hoyMes;
}

/**
 * Arma el informe del mes con reparto de fin de semana/festivo. Incluye los
 * días sin cerrar (bosquejo), igual que el original. Devuelve null si el mes no
 * tiene ningún día con datos. Puerto de imgDatos() (quin-admin.html:2173-2212).
 */
export function datosImagen(
  jornadas: Record<string, JornadaTablero>,
  calcDias: Record<string, CifraTablero>,
  metas: MetaHistorial[],
  mes: string,
  diasNulos: Record<string, unknown> = {}
): DatosImagen | null {
  const D = datosDelMes(jornadas, calcDias, mes, true, diasNulos); // incluye días sin cerrar
  const claves = Object.keys(D).sort();
  if (!claves.length) return null;

  // Reparto de los bloques de fin de semana y festivo (el sobrante al último día).
  const rep: Record<string, number> = {};
  const repP: Record<string, number> = {};
  const repD: Record<string, number> = {};
  claves.forEach((k) => {
    repP[k] = D[k].p;
    repD[k] = D[k].d;
    rep[k] = D[k].p + D[k].d;
  });
  armarBloques(claves).forEach((b) => {
    let sp = 0;
    let sd = 0;
    b.dias.forEach((k) => {
      sp += D[k].p;
      sd += D[k].d;
    });
    const rp = repartir(sp, b.dias.length);
    const rd = repartir(sd, b.dias.length);
    b.dias.forEach((k, i) => {
      repP[k] = rp[i];
      repD[k] = rd[i];
      rep[k] = rp[i] + rd[i];
    });
  });

  const metasT = claves.map((k) => metaEn(k, metas).total);
  const metasP = claves.map((k) => metaEn(k, metas).propias);
  const total = claves.reduce((a, k) => a + rep[k], 0);
  const totalP = claves.reduce((a, k) => a + repP[k], 0);
  const n = claves.length;
  const dia = claves[n - 1]; // el día que se está reportando

  let enMeta = 0;
  let enMetaP = 0;
  claves.forEach((k, i) => {
    if (rep[k] >= metasT[i]) enMeta++;
    if (repP[k] >= metasP[i]) enMetaP++;
  });

  return {
    m: mes,
    claves,
    rep,
    repP,
    repD,
    metas: metasT,
    metasP,
    total,
    totalP,
    n,
    prom: n ? Math.round(total / n) : 0,
    promP: n ? Math.round(totalP / n) : 0,
    enMeta,
    enMetaP,
    dia,
    diaTotal: rep[dia],
    diaP: repP[dia],
    diaD: repD[dia],
    metaDia: metaEn(dia, metas).total,
    metaDiaP: metaEn(dia, metas).propias,
    sinCerrar: claves.filter((k) => !D[k].cerrada).length,
  };
}
