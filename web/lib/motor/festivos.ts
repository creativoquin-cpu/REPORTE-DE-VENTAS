/**
 * Festivos de Colombia, calculados en vivo (Pascua vía Gauss/Meeus + fechas
 * fijas + fechas trasladadas al lunes por la Ley Emiliani). Portado 1:1 desde
 * quin-admin.html:516-555. Ver docs/BUSINESS-RULES.md regla 2.
 *
 * Incluye el festivo "Virgen de Chiquinquirá" (9 jul, corrido al lunes) que
 * rige desde 2026 — por eso 2026 tiene 19 festivos.
 */
import { claveFecha, fdate } from "./fechas";

/** Domingo de Pascua del año `y`. quin-admin.html:517 */
export function pascua(y: number): Date {
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    mes = Math.floor((h + l - 7 * m + 114) / 31),
    dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mes - 1, dia);
}

export function sumarDias(f: Date, n: number): Date {
  const x = new Date(f);
  x.setDate(x.getDate() + n);
  return x;
}

/** Traslada una fecha al lunes siguiente si no cae ya en lunes. quin-admin.html:525 */
export function alLunes(f: Date): Date {
  const x = new Date(f),
    w = x.getDay();
  if (w !== 1) x.setDate(x.getDate() + ((8 - w) % 7));
  return x;
}

const cacheFestivos: Record<number, Record<string, string>> = {};

/**
 * Mapa { "YYYY-MM-DD": "nombre del festivo" } para el año `y`.
 * quin-admin.html:527
 */
export function festivosColombia(y: number): Record<string, string> {
  if (cacheFestivos[y]) return cacheFestivos[y];
  const P = pascua(y);
  const R: Record<string, string> = {};
  const fijo = (m: number, d: number, n: string) => {
    R[claveFecha(y, m, d)] = n;
  };
  const mov = (m: number, d: number, n: string) => {
    const f = alLunes(new Date(y, m - 1, d));
    R[claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate())] = n;
  };
  const pas = (n: number, nom: string, mv: boolean) => {
    let f = sumarDias(P, n);
    if (mv) f = alLunes(f);
    R[claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate())] = nom;
  };
  fijo(1, 1, "Año Nuevo");
  fijo(5, 1, "Día del Trabajo");
  fijo(7, 20, "Independencia");
  fijo(8, 7, "Batalla de Boyacá");
  fijo(12, 8, "Inmaculada");
  fijo(12, 25, "Navidad");
  mov(1, 6, "Reyes Magos");
  mov(3, 19, "San José");
  mov(6, 29, "San Pedro y San Pablo");
  mov(8, 15, "Asunción");
  mov(10, 12, "Día de la Raza");
  mov(11, 1, "Todos los Santos");
  mov(11, 11, "Independencia de Cartagena");
  pas(-3, "Jueves Santo", false);
  pas(-2, "Viernes Santo", false);
  pas(43, "Ascensión", true);
  pas(64, "Corpus Christi", true);
  pas(71, "Sagrado Corazón", true);
  // Festivo nuevo desde 2026: Virgen de Chiquinquirá (9 jul), corrido al lunes.
  if (y >= 2026) mov(7, 9, "Virgen de Chiquinquirá");
  cacheFestivos[y] = R;
  return R;
}

/**
 * Motivo por el que una fecha NO es laborable, o null si sí lo es.
 * quin-admin.html:547 — `diasManuales` era global en el HTML; acá se pasa como
 * parámetro para que la función sea pura (por defecto, ninguno).
 */
export function porQueNoLaborable(
  clave: string,
  diasManuales: Record<string, unknown> = {}
): string | null {
  if (diasManuales[clave]) return "marcado a mano";
  const p = clave.split("-");
  const f = fdate(clave);
  const fest = festivosColombia(+p[0])[clave];
  if (fest) return fest;
  if (f.getDay() === 6) return "sábado";
  if (f.getDay() === 0) return "domingo";
  return null;
}
