/**
 * Corte de jornada operativa y lectura de fechas de los dos Excel.
 * Portado 1:1 desde quin-admin.html:465-514. Ver docs/BUSINESS-RULES.md regla 1.
 *
 * La jornada corta a las 8am, salvo la madrugada del sábado que corta a las
 * 7am: lo vendido antes del corte pertenece a la jornada del día anterior.
 * Aplica a Dropi (fecha+hora) y a Effi (solo si la celda trae hora).
 */
import { claveFecha } from "./fechas";

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
 * Corte 8am, 7am los sábados. quin-admin.html:483
 */
export function jornadaDe(y: number, m: number, d: number, hora: number | null): string {
  const f = new Date(y, m - 1, d);
  const corte = f.getDay() === 6 ? 7 : 8;
  if (hora != null && hora < corte) f.setDate(f.getDate() - 1);
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
export function fechaEffi(celda: CeldaExcel): string | null {
  const p = partesEffi(celda);
  if (!p) return null;
  if (p.h == null) return claveFecha(p.y, p.m, p.d);
  return jornadaDe(p.y, p.m, p.d, p.h);
}
