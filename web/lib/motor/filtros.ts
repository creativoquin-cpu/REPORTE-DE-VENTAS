/**
 * Filtros de estatus (Dropi) y vendedores (Effi): qué cuenta y qué no.
 * Portado 1:1 desde quin-admin.html:587-593, 1007-1029, 1633-1638.
 * Ver docs/BUSINESS-RULES.md reglas 4 y 5.
 */
import { aNumero, normalizar } from "./fechas";
import type { CeldaExcel } from "./jornada";

/** Una fila cualquiera de un Excel leído con SheetJS. */
export type FilaExcel = Record<string, CeldaExcel>;

/** Un valor del filtro con su conteo y si cuenta o no. */
export interface ItemFiltro {
  valor: string;
  prendas: number;
  cuenta: boolean;
}

/** Estatus de Dropi apagados por defecto (subcadena, normalizada). quin-admin.html:592 */
export const APAGADO_DROPI = ["cancelado", "devolucion", "novedad", "anulad"];
/** Vendedores de Effi apagados por defecto. quin-admin.html:593 */
export const APAGADO_EFFI = ["cambio", "miguel angel angarita ariza"];

export const SIN_TIENDA = "Tienda no identificada";

/** En Dropi la "tienda" es el vendedor; celda vacía o "none" → sin tienda. quin-admin.html:587 */
export function nombreTienda(celda: CeldaExcel): string {
  const t = String(celda == null ? "" : celda).trim();
  return t === "" || t.toLowerCase() === "none" ? SIN_TIENDA : t;
}

/** ¿El valor cae bajo alguno de los patrones apagados por defecto? quin-admin.html:1007 */
export function apagadoPorDefecto(valor: string, patrones: string[]): boolean {
  const v = normalizar(valor);
  for (let i = 0; i < patrones.length; i++) if (v.indexOf(patrones[i]) !== -1) return true;
  return false;
}

/**
 * Arma la lista de valores distintos de una columna con su total de prendas y
 * si cuenta por defecto, ordenada de mayor a menor. quin-admin.html:1012
 */
export function identificar(
  filas: FilaExcel[] | null,
  colValor: string,
  colCant: string,
  patrones: string[],
  vacioComo: string
): ItemFiltro[] {
  const mapa: Record<string, ItemFiltro> = {};
  (filas || []).forEach((r) => {
    let v = String(r[colValor] == null ? "" : r[colValor]).trim();
    if (v === "" || v.toLowerCase() === "none") v = vacioComo;
    if (!mapa[v]) mapa[v] = { valor: v, prendas: 0, cuenta: !apagadoPorDefecto(v, patrones) };
    mapa[v].prendas += aNumero(r[colCant]);
  });
  return Object.keys(mapa)
    .map((k) => mapa[k])
    .sort((a, b) => b.prendas - a.prendas);
}

/**
 * Combina la lista recién detectada con las decisiones previas (las guardadas
 * en nube y las de la sesión), preservando lo que el admin ya marcó/desmarcó.
 * quin-admin.html:1023
 */
export function fusionar(
  nueva: ItemFiltro[],
  vieja: ItemFiltro[],
  guardadas?: Record<string, boolean> | null
): ItemFiltro[] {
  const previo: Record<string, boolean> = {};
  if (guardadas) Object.keys(guardadas).forEach((k) => (previo[k] = guardadas[k]));
  vieja.forEach((x) => (previo[x.valor] = x.cuenta));
  nueva.forEach((x) => {
    if (Object.prototype.hasOwnProperty.call(previo, x.valor)) x.cuenta = previo[x.valor];
  });
  return nueva;
}

/** ¿Cuenta este valor según la lista de filtros? quin-admin.html:1633 */
export function permitido(lista: ItemFiltro[], valor: CeldaExcel, vacioComo: string): boolean {
  let v = String(valor == null ? "" : valor).trim();
  if (v === "" || v.toLowerCase() === "none") v = vacioComo;
  for (let i = 0; i < lista.length; i++) if (lista[i].valor === v) return lista[i].cuenta;
  return true;
}
