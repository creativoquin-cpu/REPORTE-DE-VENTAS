/**
 * Evita que una etiqueta de texto dibujada a mano en un <canvas> de Chart.js
 * quede tapada por otra ya colocada (por ejemplo, el rótulo de una línea de
 * meta cayendo justo sobre el número de una barra). `y` es la línea base del
 * texto (la misma que usa `ctx.fillText`); la caja ocupa de `y - h` a `y`.
 */
export interface CajaTexto {
  x: number;
  y: number;
  w: number;
  h: number;
}

function solapan(a: CajaTexto, b: CajaTexto): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y - a.h < b.y && a.y > b.y - b.h;
}

/**
 * Devuelve el `y` a usar para `caja` de modo que no se solape con ninguna de
 * `colocadas`, subiéndola de a `paso` píxeles las veces que haga falta (tope
 * `maxIntentos`, para no alejarla indefinidamente si el gráfico está muy
 * apretado).
 */
export function ySinSolape(
  caja: CajaTexto,
  colocadas: CajaTexto[],
  paso = 13,
  maxIntentos = 6
): number {
  let y = caja.y;
  for (let i = 0; i < maxIntentos; i++) {
    if (!colocadas.some((c) => solapan({ ...caja, y }, c))) return y;
    y -= paso;
  }
  return y;
}
