/**
 * Dibujo de la imagen de WhatsApp (Fase 9). Puerto fiel de imgDibujar()
 * (quin-admin.html:2226-2408): una imagen vertical 1080×1920 con el informe del
 * DÍA — la cifra grande, tres cuadros, y el mes día por día con la línea de meta
 * escalonada y rotulada.
 *
 * REGLA DE NEGOCIO (BUSINESS-RULES.md regla 9): la imagen NUNCA lleva VS, ni
 * rankings, ni nombres de personas. Solo cifras agregadas.
 *
 * Recibe el contexto 2D como parámetro (no crea el canvas), así que es
 * testeable con un lienzo falso que anota lo que se dibuja. La mascota es
 * opcional: en la app vieja `QUINO_SVG` nunca se asignaba, así que la imagen
 * salía sin ella; acá también es opcional (null por defecto).
 */
import { bonita, hoyTexto, MESES_L } from "@/lib/motor";
import type { DatosImagen } from "@/lib/motor";

export const IMG_W = 1080;
export const IMG_H = 1920;

/** Modo del informe: consolidado (propias + Dropi) o solo propias (Effi). */
export type ModoImagen = "total" | "propias";

/**
 * El subconjunto del canvas 2D que usa el dibujo. Se declara a mano (en vez de
 * `CanvasRenderingContext2D`) para poder testear con un lienzo falso sin DOM.
 */
export interface Lienzo2D {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textAlign: string;
  textBaseline: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(t: string, x: number, y: number): void;
  measureText(t: string): { width: number };
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
  fill(): void;
  stroke(): void;
  save(): void;
  restore(): void;
  setLineDash(d: number[]): void;
  drawImage(im: CanvasImageSource, x: number, y: number, w: number, h: number): void;
}

function imgRedondo(c: Lienzo2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

const F = "-apple-system,Segoe UI,Roboto,sans-serif";

/**
 * Dibuja el informe en `c`. `modo` = "total" (propias + Dropi) o "propias"
 * (solo Effi). `mascota` opcional; si es null no se dibuja.
 */
export function dibujarImagen(
  c: Lienzo2D,
  d: DatosImagen,
  mascota: CanvasImageSource | null,
  modo: ModoImagen = "total"
): void {
  const CIAN = "#14c4c4";
  const AZUL = "#2a78d6";
  const VERDE = "#1baf7a";
  const ROJO = "#d03b3b";
  const TINTA = "#111318";
  const GRIS = "#6b7280";

  const soloP = modo === "propias";

  // Valores que cambian según el informe.
  const vDia = soloP ? d.diaP : d.diaTotal;
  const vMeta = soloP ? d.metaDiaP : d.metaDia;
  const vTotal = soloP ? d.totalP : d.total;
  const vSerie = soloP ? d.repP : d.rep;
  const vMetas = soloP ? d.metasP : d.metas;

  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, IMG_W, IMG_H);
  c.fillStyle = CIAN;
  c.fillRect(0, 0, IMG_W, 14);

  const M = 70;
  c.textBaseline = "alphabetic";
  c.textAlign = "left";

  // ---- encabezado: el DÍA que se está reportando
  c.fillStyle = CIAN;
  c.font = `700 34px ${F}`;
  c.fillText("QUIN", M, 120);
  c.fillStyle = TINTA;
  c.font = `800 72px ${F}`;
  c.fillText(soloP ? "Ventas propias" : "Ventas del día", M, 210);
  c.fillStyle = GRIS;
  c.font = `400 42px ${F}`;
  c.fillText(bonita(d.dia) + (soloP ? " · solo Effi" : " · propias + Dropi"), M, 268);

  const txtMeta = "Meta " + vMeta + " prendas";
  c.font = `700 36px ${F}`;
  const wp = c.measureText(txtMeta).width + 56;
  const cumple = vDia >= vMeta;
  c.fillStyle = cumple ? "#e8f7f0" : "#fdecec";
  imgRedondo(c, M, 300, wp, 66, 33);
  c.fill();
  c.fillStyle = cumple ? VERDE : ROJO;
  c.fillText(txtMeta, M + 28, 345);

  // ---- cifra grande del día
  c.fillStyle = TINTA;
  c.font = `800 200px ${F}`;
  c.fillText(String(vDia), M, 560);
  const wn = c.measureText(String(vDia)).width;
  c.fillStyle = GRIS;
  c.font = `400 44px ${F}`;
  c.fillText("prendas", M + wn + 24, 560);
  c.fillStyle = cumple ? VERDE : ROJO;
  c.font = `700 38px ${F}`;
  c.fillText(cumple ? "Meta cumplida" : "Faltaron " + (vMeta - vDia) + " para la meta", M, 616);

  // ---- tres cuadros
  const cuadros: Array<[string, string, string]> = soloP
    ? [
        ["Total del mes", String(d.totalP), AZUL],
        ["Promedio del mes", String(d.promP), TINTA],
        ["Días en meta", d.enMetaP + " de " + d.n, VERDE],
      ]
    : [
        ["Propias (Effi)", String(d.diaP), AZUL],
        ["Dropi", String(d.diaD), VERDE],
        ["Promedio del mes", String(d.prom), TINTA],
      ];
  const cw = (IMG_W - M * 2 - 40) / 3;
  const cy = 660;
  const ch = 170;
  cuadros.forEach((t, i) => {
    const x = M + i * (cw + 20);
    c.fillStyle = "#f6f7f9";
    imgRedondo(c, x, cy, cw, ch, 22);
    c.fill();
    c.fillStyle = t[2];
    imgRedondo(c, x, cy, 10, ch, 5);
    c.fill();
    c.fillStyle = GRIS;
    c.font = `600 28px ${F}`;
    c.fillText(t[0], x + 32, cy + 52);
    c.fillStyle = TINTA;
    c.font = `800 68px ${F}`;
    c.fillText(t[1], x + 32, cy + 130);
    if (t[0] === "Promedio del mes") {
      c.fillStyle = GRIS;
      c.font = `400 24px ${F}`;
      c.fillText("por día", x + 32, cy + 158);
    }
  });

  // ---- el mes día por día
  c.fillStyle = TINTA;
  c.font = `700 40px ${F}`;
  const p = d.m.split("-");
  c.fillText("El mes día por día · " + MESES_L[+p[1] - 1] + " " + p[0], M, 910);
  c.fillStyle = GRIS;
  c.font = `400 28px ${F}`;
  c.fillText(vTotal + " prendas en " + d.n + " día" + (d.n === 1 ? "" : "s"), M, 952);

  const gx = M;
  const gw = IMG_W - M * 2;
  const gTop = 1010;
  const gBase = 1490;
  let maxV = 0;
  d.claves.forEach((k) => (maxV = Math.max(maxV, vSerie[k])));
  vMetas.forEach((v) => (maxV = Math.max(maxV, v)));
  maxV = maxV || 1;
  const esc = (gBase - gTop) / (maxV * 1.06);

  const n = d.claves.length;
  const paso = gw / n;
  const ancho = Math.min(paso * 0.68, 64);
  const fNum = n > 22 ? 19 : n > 14 ? 23 : 27;
  const fDia = n > 22 ? 19 : 23;

  d.claves.forEach((k, i) => {
    const xc = gx + paso * i + paso / 2;
    const v = vSerie[k];
    const h = Math.round(v * esc);
    const hoy = k === d.dia;
    if (soloP) {
      // Una sola barra azul: las propias.
      c.fillStyle = AZUL;
      imgRedondo(c, xc - ancho / 2, gBase - h, ancho, Math.max(h, 2), 8);
      c.fill();
    } else {
      // Barra partida: abajo las propias, encima Dropi.
      const hp = Math.round(d.repP[k] * esc);
      const hd = Math.max(h - hp, 0);
      c.fillStyle = VERDE;
      imgRedondo(c, xc - ancho / 2, gBase - h, ancho, Math.max(hd, 2), 8);
      c.fill();
      c.fillStyle = AZUL;
      c.fillRect(xc - ancho / 2, gBase - hp, ancho, Math.max(hp, 2));
    }
    c.fillStyle = hoy ? TINTA : GRIS;
    c.textAlign = "center";
    c.font = (hoy ? "800 " : "700 ") + fNum + "px " + F;
    if (v) c.fillText(String(v), xc, gBase - h - 14);
    c.fillStyle = hoy ? TINTA : GRIS;
    c.font = (hoy ? "700 " : "400 ") + fDia + "px " + F;
    c.fillText(k.split("-")[2], xc, gBase + 38);
    c.textAlign = "left";
  });

  c.strokeStyle = "#e1e0d9";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(gx, gBase);
  c.lineTo(gx + gw, gBase);
  c.stroke();

  // Línea de meta: un tramo por día (la meta puede cambiar a mitad de mes).
  c.strokeStyle = ROJO;
  c.lineWidth = 4;
  c.setLineDash([14, 10]);
  c.beginPath();
  d.claves.forEach((k, i) => {
    const y = gBase - vMetas[i] * esc;
    if (y < gTop - 40) return;
    c.moveTo(gx + paso * i, y);
    c.lineTo(gx + paso * (i + 1), y);
  });
  c.stroke();
  c.setLineDash([]);

  // El valor de la meta, rotulado sobre la línea cada vez que cambia.
  c.fillStyle = ROJO;
  c.font = `700 26px ${F}`;
  d.claves.forEach((k, i) => {
    if (i && vMetas[i] === vMetas[i - 1]) return;
    const y = gBase - vMetas[i] * esc;
    if (y < gTop - 20) return;
    const et = "Meta " + vMetas[i];
    const w = c.measureText(et).width + 18;
    const x = Math.min(gx + paso * i + 6, gx + gw - w);
    c.fillStyle = "#ffffff";
    c.fillRect(x - 6, y - 32, w, 30);
    c.fillStyle = ROJO;
    c.fillText(et, x, y - 10);
  });

  // Leyenda.
  const ly = 1580;
  function cuadro(x: number, color: string, txt: string): number {
    c.fillStyle = color;
    imgRedondo(c, x, ly - 22, 26, 26, 7);
    c.fill();
    c.fillStyle = GRIS;
    c.font = `400 26px ${F}`;
    c.fillText(txt, x + 38, ly);
    return x + 38 + c.measureText(txt).width + 34;
  }
  let lx = cuadro(M, AZUL, "Propias (Effi)");
  if (!soloP) lx = cuadro(lx, VERDE, "Dropi");
  c.fillStyle = ROJO;
  c.fillRect(lx, ly - 14, 34, 5);
  c.fillStyle = GRIS;
  c.font = `400 26px ${F}`;
  c.fillText("Meta del día", lx + 46, ly);

  // ---- pie
  c.fillStyle = GRIS;
  c.font = `400 28px ${F}`;
  c.fillText(
    soloP
      ? "Solo ventas propias (Effi). No incluye Dropi."
      : "Fines de semana y festivos repartidos entre sus días.",
    M,
    1670
  );
  c.fillText("Actualizado " + hoyTexto(), M, 1714);
  if (d.sinCerrar)
    c.fillText(
      "Incluye " + d.sinCerrar + " día" + (d.sinCerrar === 1 ? "" : "s") + " sin cerrar: puede cambiar.",
      M,
      1758
    );

  if (mascota) {
    const mh = 300;
    const mw = Math.round((mh * 622.76) / 1106.32);
    try {
      c.drawImage(mascota, IMG_W - M - mw, IMG_H - 120 - mh, mw, mh);
    } catch {
      // Si la mascota no se puede dibujar, la imagen sale igual sin ella.
    }
  }
  c.fillStyle = CIAN;
  c.fillRect(0, IMG_H - 14, IMG_W, 14);
}
