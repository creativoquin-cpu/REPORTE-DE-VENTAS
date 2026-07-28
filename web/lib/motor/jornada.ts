/**
 * Corte de jornada operativa y lectura de fechas de los dos Excel.
 * Portado 1:1 desde quin-admin.html:465-514. Ver docs/BUSINESS-RULES.md regla 1.
 *
 * La jornada corta por defecto a las 8am, salvo la madrugada del sábado que
 * corta a las 7am: lo vendido antes del corte pertenece a la jornada del día
 * anterior. Aplica a Dropi (fecha+hora) y a Effi (solo si la celda trae hora).
 *
 * Editable desde 28-jul-2026: el corte dejó de estar fijo en el código porque
 * la jornada de la agencia cambió — ahora vive en `ajustes.datos`
 * (corteSemana/corteSabado) y lo edita el admin en el panel "Cargar y
 * validar". Estos valores son solo el POR DEFECTO si no hay nada guardado.
 */
import { claveFecha } from "./fechas";

/** Horas de corte (0–23) de la jornada operativa. */
export interface CorteJornada {
  /** Hora de corte de lunes a viernes (y domingo). */
  semana: number;
  /** Hora de corte de la madrugada del sábado. */
  sabado: number;
}

/** Valores de arranque si el admin nunca guardó un corte propio. */
export const CORTE_JORNADA_POR_DEFECTO: CorteJornada = { semana: 8, sabado: 7 };

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
 * Corte configurable (por defecto 8am, 7am los sábados). quin-admin.html:483
 */
export function jornadaDe(
  y: number,
  m: number,
  d: number,
  hora: number | null,
  corte: CorteJornada = CORTE_JORNADA_POR_DEFECTO
): string {
  const f = new Date(y, m - 1, d);
  const c = f.getDay() === 6 ? corte.sabado : corte.semana;
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
  corte: CorteJornada = CORTE_JORNADA_POR_DEFECTO
): string | null {
  const p = partesEffi(celda);
  if (!p) return null;
  if (p.h == null) return claveFecha(p.y, p.m, p.d);
  return jornadaDe(p.y, p.m, p.d, p.h, corte);
}
