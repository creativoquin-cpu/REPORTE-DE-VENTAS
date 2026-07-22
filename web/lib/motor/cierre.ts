/**
 * Lógica pura del cierre mensual (lado lectura). Puerto de estadoMes()
 * (quin-admin.html:1233-1238) y de la parte de sumas de resumenMes()
 * (1168-1189). El sellado/reapertura que ESCRIBE llega en 4b-2; acá solo va
 * lo que necesita el panel de cierre para mostrarse.
 *
 * Funciones puras: el "mes de hoy" entra como parámetro (`mesActual`), no se
 * llama a `new Date()` acá — igual criterio que lib/motor/equipo.ts.
 */

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
