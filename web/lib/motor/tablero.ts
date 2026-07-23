/**
 * Tablero del mes (Fase 5): arma los datos del mes (jornadas cerradas +,
 * opcional, el bosquejo del Excel) y calcula todos los KPIs, el reparto por
 * día, las metas por día y los rankings. Puerto PURO de datosDelMes()
 * (quin-admin.html:1839-1852) y de la parte de cálculo de pintarTablero()
 * (1868-1996) — sin nada del render, que en Next.js lo hace React.
 *
 * Igual que el resto del motor: sin DOM, sin fetch; el "hoy" entra como
 * parámetro.
 */
import { armarBloques, repartir } from "./reparto";
import { metaEn, type MetaHistorial } from "./metas";

/** Un día del tablero: cifras + detalle + si está cerrado (oficial) o es bosquejo. */
export interface DiaTablero {
  p: number;
  d: number;
  ven: Record<string, number>;
  tie: Record<string, number>;
  cerrada: boolean;
}

/** Jornada cerrada tal como la tiene el store (subconjunto que usa el tablero). */
export interface JornadaTablero {
  propias: number;
  dropi: number;
  ven: Record<string, number>;
  tie: Record<string, number>;
}

/** Cifra del cálculo del Excel para un día (bosquejo). */
export interface CifraTablero {
  propias: number;
  dropi: number;
  ven: Record<string, number>;
  tie: Record<string, number>;
}

/**
 * Aplica los "días nulos" (días de descanso / sin ventas) a un mapa de días:
 * saca cada día nulo del mapa y suma sus ventas al día REAL anterior (el día
 * previo con datos que no sea nulo). Un día nulo no cuenta como día y no entra
 * en el reparto de fin de semana; si trae ventas, se atribuyen al día anterior
 * (ej.: sábado 315 + domingo nulo 30 → sábado 345, domingo afuera). Si el día
 * nulo es el primero y no hay un día real antes, sus ventas se descartan.
 *
 * Es DISTINTO de "no laborable": el no laborable sí entra al reparto (suma y
 * divide en partes iguales entre los días del bloque); el nulo no reparte, se
 * lleva sus ventas al día anterior. Ver docs/BUSINESS-RULES.md.
 */
export function aplicarDiasNulos(
  D: Record<string, DiaTablero>,
  diasNulos: Record<string, unknown>
): Record<string, DiaTablero> {
  const claves = Object.keys(D).sort();
  const out: Record<string, DiaTablero> = {};
  let ultimoReal: string | null = null;
  claves.forEach((k) => {
    if (diasNulos[k]) {
      if (ultimoReal) {
        const dst = out[ultimoReal];
        const src = D[k];
        dst.p += src.p;
        dst.d += src.d;
        Object.keys(src.ven).forEach((v) => (dst.ven[v] = (dst.ven[v] || 0) + src.ven[v]));
        Object.keys(src.tie).forEach((t) => (dst.tie[t] = (dst.tie[t] || 0) + src.tie[t]));
      }
      return; // el día nulo no se agrega al resultado
    }
    // Se clonan ven/tie para no mutar la entrada original al acumular.
    out[k] = { ...D[k], ven: { ...D[k].ven }, tie: { ...D[k].tie } };
    ultimoReal = k;
  });
  return out;
}

/**
 * Datos del mes: las jornadas cerradas y, si `incluirBosquejo`, también los días
 * del Excel que aún no se cierran (sin pisar lo ya cerrado). Al final aplica los
 * `diasNulos` (días de descanso): esos días se sacan del cálculo y sus ventas
 * pasan al día anterior (ver aplicarDiasNulos).
 */
export function datosDelMes(
  jornadas: Record<string, JornadaTablero>,
  calcDias: Record<string, CifraTablero>,
  mes: string,
  incluirBosquejo: boolean,
  diasNulos: Record<string, unknown> = {}
): Record<string, DiaTablero> {
  const D: Record<string, DiaTablero> = {};
  Object.keys(jornadas).forEach((k) => {
    if (k.slice(0, 7) !== mes) return;
    const j = jornadas[k];
    D[k] = { p: j.propias, d: j.dropi, ven: j.ven, tie: j.tie, cerrada: true };
  });
  if (incluirBosquejo) {
    Object.keys(calcDias).forEach((k) => {
      if (k.slice(0, 7) !== mes || D[k]) return;
      const c = calcDias[k];
      D[k] = { p: c.propias, d: c.dropi, ven: c.ven, tie: c.tie, cerrada: false };
    });
  }
  return aplicarDiasNulos(D, diasNulos);
}

export interface EntradaRanking {
  nombre: string;
  n: number;
}

export interface ResumenTablero {
  claves: string[];
  /** Reales por día, alineados con `claves`. */
  realP: number[];
  realD: number[];
  /** Repartidos por día, alineados con `claves`. */
  repP: number[];
  repD: number[];
  /** Meta total y de propias por día, alineadas con `claves`. */
  metaT: number[];
  metaP: number[];
  /** Si el día está cerrado (oficial), alineado con `claves`. */
  cerradas: boolean[];
  tP: number;
  tD: number;
  total: number;
  n: number;
  prom: number;
  pct: number;
  mejor: { k: string; t: number; cerrada: boolean } | null;
  peor: { k: string; t: number; cerrada: boolean } | null;
  enMetaT: number;
  enMetaP: number;
  metaSumaT: number;
  metaSumaP: number;
  abiertas: number;
  cerradasN: number;
  /** Prendas de hoy (si el día está en el mes), o null. */
  hoy: number | null;
  hoyCerrada: boolean;
  /** Rankings del mes (detalle privado). `faltan` = jornadas sin detalle. */
  rankingVend: EntradaRanking[];
  rankingTie: EntradaRanking[];
  faltan: number;
}

function ordenarRanking(mapa: Record<string, number>): EntradaRanking[] {
  return Object.keys(mapa)
    .map((nombre) => ({ nombre, n: mapa[nombre] }))
    .sort((a, b) => b.n - a.n || (a.nombre < b.nombre ? -1 : 1));
}

/** Calcula todos los KPIs, reparto, metas por día y rankings del mes. */
export function resumenTablero(
  D: Record<string, DiaTablero>,
  metas: MetaHistorial[],
  hoyClave: string
): ResumenTablero {
  const claves = Object.keys(D).sort();
  const n = claves.length;

  const realP = claves.map((k) => D[k].p);
  const realD = claves.map((k) => D[k].d);
  const cerradas = claves.map((k) => D[k].cerrada);

  // Reparto de bloques de fin de semana/festivo.
  const repPmap: Record<string, number> = {};
  const repDmap: Record<string, number> = {};
  claves.forEach((k) => {
    repPmap[k] = D[k].p;
    repDmap[k] = D[k].d;
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
      repPmap[k] = rp[i];
      repDmap[k] = rd[i];
    });
  });
  const repP = claves.map((k) => repPmap[k]);
  const repD = claves.map((k) => repDmap[k]);

  const tP = realP.reduce((a, x) => a + x, 0);
  const tD = realD.reduce((a, x) => a + x, 0);
  const total = tP + tD;
  const prom = n ? Math.round(total / n) : 0;
  const pct = total ? Math.round((tP * 100) / total) : 0;

  let mejor: ResumenTablero["mejor"] = null;
  let peor: ResumenTablero["peor"] = null;
  claves.forEach((k) => {
    const t = D[k].p + D[k].d;
    if (!mejor || t > mejor.t) mejor = { k, t, cerrada: D[k].cerrada };
    if (!peor || t < peor.t) peor = { k, t, cerrada: D[k].cerrada };
  });

  const metaT = claves.map((k) => metaEn(k, metas).total);
  const metaP = claves.map((k) => metaEn(k, metas).propias);
  let enMetaT = 0;
  let enMetaP = 0;
  claves.forEach((k, i) => {
    if (D[k].p + D[k].d >= metaT[i]) enMetaT++;
    if (D[k].p >= metaP[i]) enMetaP++;
  });
  const metaSumaT = metaT.reduce((a, m) => a + m, 0);
  const metaSumaP = metaP.reduce((a, m) => a + m, 0);

  const abiertas = cerradas.filter((c) => !c).length;
  const cerradasN = n - abiertas;

  const hoyDia = D[hoyClave];
  const hoy = hoyDia ? hoyDia.p + hoyDia.d : null;

  // Rankings: acumulan el detalle por vendedor/tienda; `faltan` cuenta las
  // jornadas sin detalle guardado.
  const acVen: Record<string, number> = {};
  const acTie: Record<string, number> = {};
  let faltan = 0;
  claves.forEach((k) => {
    const o = D[k];
    const sinDetalle = Object.keys(o.ven).length === 0 && Object.keys(o.tie).length === 0;
    if (sinDetalle) {
      faltan++;
      return;
    }
    Object.keys(o.ven).forEach((v) => (acVen[v] = (acVen[v] || 0) + o.ven[v]));
    Object.keys(o.tie).forEach((t) => (acTie[t] = (acTie[t] || 0) + o.tie[t]));
  });

  return {
    claves,
    realP,
    realD,
    repP,
    repD,
    metaT,
    metaP,
    cerradas,
    tP,
    tD,
    total,
    n,
    prom,
    pct,
    mejor,
    peor,
    enMetaT,
    enMetaP,
    metaSumaT,
    metaSumaP,
    abiertas,
    cerradasN,
    hoy,
    hoyCerrada: hoyDia ? hoyDia.cerrada : false,
    rankingVend: ordenarRanking(acVen),
    rankingTie: ordenarRanking(acTie),
    faltan,
  };
}
