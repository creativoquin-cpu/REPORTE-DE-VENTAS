/**
 * Corte de jornada operativa y lectura de fechas de los dos Excel.
 * Portado 1:1 desde quin-admin.html:465-514. Ver docs/BUSINESS-RULES.md regla 1.
 *
 * La jornada corta por defecto a las 8am, salvo la madrugada del sábado que
 * corta a las 7am: lo vendido antes del corte pertenece a la jornada del día
 * anterior. Aplica a Dropi (fecha+hora) y a Effi (solo si la celda trae hora).
 *
 * Editable desde 28-jul-2026: el corte dejó de estar fijo en el código porque
 * la jornada de la agencia cambió — ahora vive en `ajustes.datos.corteRangos`
 * y lo edita el admin en el panel "Cargar y validar". Estos valores son solo
 * el POR DEFECTO si no hay nada guardado.
 *
 * Desde 01-ago-2026 (segundo cambio de regla) el corte dejó de ser solo
 * "entre semana / sábado": ahora es una lista de RANGOS, cada uno con sus
 * días de la semana y su hora. Un rango puede marcarse `correrSiFestivo`: si
 * el día que le toca esta semana cae festivo (o está marcado a mano como no
 * laborable), el corte de ese rango se corre día por día hasta el primer día
 * hábil siguiente — así el "corte largo" del lunes (que barre lo vendido el
 * fin de semana) aterriza en el martes cuando el lunes es puente.
 */
import { claveFecha } from "./fechas";
import { festivosColombia } from "./festivos";

/** Un tramo de días de la semana con su propia hora de corte. */
export interface RangoCorte {
  /** Días que cubre (0=domingo … 6=sábado, igual que Date.getDay()). */
  dias: number[];
  /** Hora de corte, en horas decimales (0–24): 7:30am = 7.5, 6:20am = 6 + 20/60. */
  hora: number;
  /**
   * Si el día que le toca esta semana a este rango cae festivo (o marcado a
   * mano como no laborable), el corte se corre al primer día hábil siguiente
   * en vez de aplicarse ese día. Pensado para rangos de un solo día (ej. el
   * lunes).
   */
  correrSiFestivo?: boolean;
}

/** Horas de corte de la jornada operativa: un rango por cada tramo de días. */
export type CorteJornada = RangoCorte[];

/** Hora de corte si ningún rango cubre el día de la semana que se está pidiendo. */
const CORTE_SIN_CONFIGURAR = 8;

/**
 * Valores de arranque si el admin nunca guardó un corte propio — la regla
 * vigente desde el 01-ago-2026: lunes 8am (se corre al primer día hábil si el
 * lunes es festivo), martes a viernes 7:30am, fin de semana (sáb+dom, se
 * acumula) 7am.
 */
export const CORTE_JORNADA_POR_DEFECTO: CorteJornada = [
  { dias: [1], hora: 8, correrSiFestivo: true },
  { dias: [2, 3, 4, 5], hora: 7.5 },
  { dias: [6, 0], hora: 7 },
];

function esFestivoOCerrado(clave: string, diasManuales: Record<string, unknown>): boolean {
  if (diasManuales[clave]) return true;
  const anio = +clave.slice(0, 4);
  return !!festivosColombia(anio)[clave];
}

/** Fecha del rango [nat, nat+6] con motivo festivo, corrida día por día hasta
 * el primer día hábil — o `nat` mismo si ya es hábil. */
function primerHabilDesde(nat: Date, diasManuales: Record<string, unknown>): Date {
  const cursor = new Date(nat);
  while (esFestivoOCerrado(claveFecha(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()), diasManuales)) {
    cursor.setDate(cursor.getDate() + 1);
  }
  return cursor;
}

/**
 * Hora de corte vigente para la fecha `f`, resolviendo los rangos
 * `correrSiFestivo` contra `diasManuales` (días festivos/marcados a mano).
 */
export function horaDeCorte(
  f: Date,
  corte: CorteJornada,
  diasManuales: Record<string, unknown> = {}
): number {
  const dow = f.getDay();

  // 1. Rangos "corridos": ¿alguno aterriza justo en `f` esta semana?
  for (const r of corte) {
    if (!r.correrSiFestivo) continue;
    for (const d of r.dias) {
      const delta = (dow - d + 7) % 7;
      const nat = new Date(f);
      nat.setDate(nat.getDate() - delta);
      const landing = primerHabilDesde(nat, diasManuales);
      if (
        landing.getFullYear() === f.getFullYear() &&
        landing.getMonth() === f.getMonth() &&
        landing.getDate() === f.getDate()
      ) {
        return r.hora;
      }
    }
  }

  // 2. Rango normal (sin correrSiFestivo) que cubra el día de la semana de `f`.
  for (const r of corte) {
    if (r.correrSiFestivo) continue;
    if (r.dias.includes(dow)) return r.hora;
  }

  return CORTE_SIN_CONFIGURAR;
}

/** Valor crudo de una celda de Excel tal como lo entrega SheetJS. */
export type CeldaExcel = Date | string | number | null | undefined;

export interface FechaYMD {
  y: number;
  m: number;
  d: number;
}

/** Lee la celda de fecha de Dropi. quin-admin.html:466 */
export function fechaDropi(celda: CeldaExcel): FechaYMD | null {
  if (celda instanceof Date)
    return { y: celda.getFullYear(), m: celda.getMonth() + 1, d: celda.getDate() };
  const t = String(celda == null ? "" : celda).trim();
  let m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return { y: +m[3], m: +m[2], d: +m[1] };
  m = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  return null;
}

/** Hora decimal (0–24) de una celda de Dropi, o null. quin-admin.html:476 */
export function horaDropi(celda: CeldaExcel): number | null {
  if (celda instanceof Date) return celda.getHours() + celda.getMinutes() / 60;
  if (typeof celda === "number") return (celda - Math.floor(celda)) * 24;
  const m = String(celda == null ? "" : celda)
    .trim()
    .match(/^(\d{1,2}):(\d{2})/);
  return m ? +m[1] + +m[2] / 60 : null;
}

/**
 * Día operativo (clave "YYYY-MM-DD") de una venta según su fecha y hora.
 * Corte configurable por rangos de días (ver `horaDeCorte`). quin-admin.html:483
 */
export function jornadaDe(
  y: number,
  m: number,
  d: number,
  hora: number | null,
  corte: CorteJornada = CORTE_JORNADA_POR_DEFECTO,
  diasManuales: Record<string, unknown> = {}
): string {
  const f = new Date(y, m - 1, d);
  const c = horaDeCorte(f, corte, diasManuales);
  if (hora != null && hora < c) f.setDate(f.getDate() - 1);
  return claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate());
}

export interface PartesEffi extends FechaYMD {
  /** Hora en horas decimales, o null si la celda no la trae. */
  h: number | null;
}

/** Descompone la celda de fecha de Effi en { y, m, d, h }. quin-admin.html:491 */
export function partesEffi(celda: CeldaExcel): PartesEffi | null {
  if (celda instanceof Date)
    return {
      y: celda.getFullYear(),
      m: celda.getMonth() + 1,
      d: celda.getDate(),
      h: celda.getHours() + celda.getMinutes() / 60 + celda.getSeconds() / 3600,
    };
  const t = String(celda == null ? "" : celda).trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m)
    return {
      y: +m[1],
      m: +m[2],
      d: +m[3],
      h: m[4] == null ? null : +m[4] + +m[5] / 60 + +(m[6] || 0) / 3600,
    };
  m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m)
    return {
      y: +m[3],
      m: +m[2],
      d: +m[1],
      h: m[4] == null ? null : +m[4] + +m[5] / 60 + +(m[6] || 0) / 3600,
    };
  return null;
}

/**
 * Día operativo de una venta de Effi. Si la celda no trae hora, se toma el día
 * tal cual; si la trae, aplica el mismo corte de jornada que Dropi.
 * Decidido por el dueño el 19-jul-2026. quin-admin.html:509
 */
export function fechaEffi(
  celda: CeldaExcel,
  corte: CorteJornada = CORTE_JORNADA_POR_DEFECTO,
  diasManuales: Record<string, unknown> = {}
): string | null {
  const p = partesEffi(celda);
  if (!p) return null;
  if (p.h == null) return claveFecha(p.y, p.m, p.d);
  return jornadaDe(p.y, p.m, p.d, p.h, corte, diasManuales);
}
