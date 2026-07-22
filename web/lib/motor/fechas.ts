/**
 * Helpers base de fecha y número, portados 1:1 desde quin-admin.html
 * (claveFecha:424, DIAS/MESES:427, aNumero:419, normalizar:414, fdate/bonita:456).
 *
 * Son funciones puras sin dependencia del DOM ni de estado global — la base
 * sobre la que se apoya el resto del motor.
 */

export const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
export const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;
export const MESES_L = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

/** "YYYY-MM-DD" con mes y día a dos dígitos. quin-admin.html:424 */
export function claveFecha(y: number, m: number, d: number): string {
  return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}

/** Convierte una clave "YYYY-MM-DD" en Date local. quin-admin.html:456 */
export function fdate(k: string): Date {
  const p = k.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

/** Etiqueta amigable "vie 10-jul". quin-admin.html:457 */
export function bonita(k: string | null | undefined): string {
  if (!k) return "—";
  const p = k.split("-");
  return DIAS[fdate(k).getDay()] + " " + p[2] + "-" + MESES[+p[1] - 1];
}

/** Texto → número tolerante a coma decimal y basura. quin-admin.html:419 */
export function aNumero(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

/**
 * Normaliza texto para comparar: sin tildes, minúsculas, espacios colapsados.
 * quin-admin.html:414
 */
const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");
export function normalizar(t: unknown): string {
  return String(t == null ? "" : t)
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
