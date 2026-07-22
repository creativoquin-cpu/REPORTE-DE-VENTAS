/**
 * Reparto de fin de semana / festivos. Portado 1:1 desde quin-admin.html:556-574.
 * Ver docs/BUSINESS-RULES.md regla 3: reparto parejo en enteros, TODO el
 * sobrante al ÚLTIMO día del bloque. Effi y Dropi se reparten por separado.
 */
import { fdate } from "./fechas";
import { porQueNoLaborable } from "./festivos";

/** Reparte `total` en `n` días: base pareja y todo el sobrante al último. quin-admin.html:557 */
export function repartir(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const sobrante = total - base * n;
  const r: number[] = [];
  for (let i = 0; i < n; i++) r.push(base);
  r[n - 1] += sobrante;
  return r;
}

export interface Bloque {
  dias: string[];
}

/**
 * Agrupa días no laborables CONSECUTIVOS en bloques. quin-admin.html:564
 * `diasManuales` era global en el HTML; acá se pasa explícito.
 */
export function armarBloques(
  claves: string[],
  diasManuales: Record<string, unknown> = {}
): Bloque[] {
  const bloques: Bloque[] = [];
  let act: Bloque | null = null;
  claves.forEach((k, i) => {
    const seguido =
      i === 0 ? true : +fdate(k) - +fdate(claves[i - 1]) === 86400000;
    if (porQueNoLaborable(k, diasManuales)) {
      if (!act || !seguido) {
        act = { dias: [] };
        bloques.push(act);
      }
      act.dias.push(k);
    } else act = null;
  });
  return bloques;
}
