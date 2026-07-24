/**
 * Dibujo de la imagen de WhatsApp (rediseño "story", inspirado en las tarjetas
 * de "Jornada Quin Actual.html"): una tarjeta vertical 1080×1920 con gradiente,
 * la marca, Quino, la meta del día, la cifra grande, un mini-gráfico de los
 * últimos 7 días con su línea de meta, y la fecha. Dos versiones coherentes:
 *  - "total": gradiente menta→teal claro, texto tinta, mini-gráfico claro.
 *  - "propias": gradiente oscuro, texto teal/blanco, mini-gráfico oscuro.
 *
 * REGLA DE NEGOCIO (BUSINESS-RULES.md regla 9): la imagen NUNCA lleva VS, ni
 * rankings, ni nombres de personas. Solo cifras agregadas.
 *
 * Recibe el contexto 2D como parámetro (no crea el canvas), así que es testeable
 * con un lienzo falso que anota lo que se dibuja. La mascota es opcional.
 */
import { MESES_L } from "@/lib/motor";
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

function hexArr(h: string): [number, number, number] {
  const n = h.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
function mezcla(a: string, b: string, t: number): string {
  const pa = hexArr(a);
  const pb = hexArr(b);
  const m = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}
function rgba(hex: string, alpha: number): string {
  const p = hexArr(hex);
  return `rgba(${p[0]},${p[1]},${p[2]},${alpha})`;
}
/** Gradiente vertical aproximado con franjas (Lienzo2D no expone gradientes). */
function gradienteVertical(c: Lienzo2D, arriba: string, abajo: string): void {
  const pasos = 160;
  for (let i = 0; i < pasos; i++) {
    c.fillStyle = mezcla(arriba, abajo, i / (pasos - 1));
    const y0 = Math.round((IMG_H * i) / pasos);
    const y1 = Math.round((IMG_H * (i + 1)) / pasos);
    // +1 para tapar la costura entre franjas, sin pasarse del borde inferior.
    c.fillRect(0, y0, IMG_W, Math.min(y1 - y0 + 1, IMG_H - y0));
  }
}

/**
 * Dibuja la tarjeta en `c`. `modo` = "total" (propias + Dropi) o "propias"
 * (solo Effi). `mascota` opcional; si es null no se dibuja.
 */
export function dibujarImagen(
  c: Lienzo2D,
  d: DatosImagen,
  mascota: CanvasImageSource | null,
  modo: ModoImagen = "total"
): void {
  // Paleta (tokens del manual de marca).
  const INK = "#091315";
  const INK2 = "#123b3d";
  const TINTA3 = "#17383a";
  const TEAL = "#00a89d";
  const TEAL_OSC = "#007a72";
  const MENTA2 = "#c7faf5";
  const G4 = "#bfd0d1";
  const G6 = "#d4dfe0";
  const WHITE = "#ffffff";

  const soloP = modo === "propias";

  // Valores que cambian según el informe.
  const vDia = soloP ? d.diaP : d.diaTotal;
  const meta = soloP ? d.metaDiaP : d.metaDia;
  const serie = soloP ? d.repP : d.rep;

  // Colores por versión.
  const bgArriba = soloP ? INK2 : MENTA2;
  const bgAbajo = soloP ? INK : TEAL;
  const brandCol = soloP ? TEAL : INK;
  const titleCol = soloP ? WHITE : INK;
  const valueCol = soloP ? TEAL : INK;
  const unitCol = soloP ? G6 : INK2;
  const dateCol = soloP ? G4 : INK2;
  const boxCol = soloP ? TINTA3 : WHITE;
  const labelCol = soloP ? WHITE : INK;
  const barCol = soloP ? TEAL : TEAL_OSC;
  const barDim = rgba(barCol, 0.5);
  const valCol = soloP ? WHITE : INK;
  const valDim = rgba(soloP ? WHITE : INK, 0.65);
  const metaLineCol = soloP ? "rgba(255,255,255,.55)" : "rgba(9,19,21,.42)";

  const cx = IMG_W / 2;

  // ---- fondo con gradiente
  gradienteVertical(c, bgArriba, bgAbajo);

  c.textBaseline = "alphabetic";
  c.textAlign = "center";

  // ---- marca
  c.fillStyle = brandCol;
  c.font = `800 32px ${F}`;
  c.fillText(`AGENCIA QUIN · ${soloP ? "PROPIAS" : "TOTAL"}`, cx, 150);

  // ---- mascota (nuestra Quino), centrada arriba
  if (mascota) {
    const iw = (mascota as { width?: number }).width || 512;
    const ih = (mascota as { height?: number }).height || 512;
    const maxH = 330;
    const maxW = 360;
    let mh = maxH;
    let mw = Math.round(mh * (iw / ih));
    if (mw > maxW) {
      mw = maxW;
      mh = Math.round(mw * (ih / iw));
    }
    try {
      c.drawImage(mascota, Math.round(cx - mw / 2), 200, mw, mh);
    } catch {
      // Si la mascota no se puede dibujar, la tarjeta sale igual sin ella.
    }
  }

  // ---- meta + cifra grande del día
  c.fillStyle = titleCol;
  c.font = `900 104px ${F}`;
  c.fillText(`Meta ${meta}`, cx, 640);

  c.fillStyle = valueCol;
  c.font = `900 200px ${F}`;
  c.fillText(String(vDia), cx, 830);

  c.fillStyle = unitCol;
  c.font = `700 40px ${F}`;
  c.fillText(soloP ? "prendas propias · Effi" : "prendas del día", cx, 892);

  // ---- mini-gráfico de los últimos 7 días
  const P = 84;
  const bx = P;
  const by = 980;
  const bw = IMG_W - 2 * P;
  const bh = 720;
  c.fillStyle = boxCol;
  imgRedondo(c, bx, by, bw, bh, 34);
  c.fill();

  c.fillStyle = labelCol;
  c.font = `800 30px ${F}`;
  c.textAlign = "left";
  c.fillText(`Últimos 7 días · meta ${meta}`, bx + 44, by + 66);

  const ult = d.claves.slice(-7);
  const vals = ult.map((k) => serie[k] ?? 0);
  const escala = Math.max(...vals, meta, 1);

  const plotL = bx + 44;
  const plotR = bx + bw - 44;
  const plotBot = by + bh - 72;
  const plotTop = by + 150;
  const PH = plotBot - plotTop;
  const slot = ult.length ? (plotR - plotL) / ult.length : plotR - plotL;
  const barW = Math.min(slot * 0.5, 74);

  // línea de la meta diaria (la cabecera ya dice el valor)
  const my = plotBot - (meta / escala) * PH;
  c.strokeStyle = metaLineCol;
  c.lineWidth = 3;
  c.setLineDash([14, 10]);
  c.beginPath();
  c.moveTo(plotL, my);
  c.lineTo(plotR, my);
  c.stroke();
  c.setLineDash([]);

  ult.forEach((k, i) => {
    const v = vals[i];
    const h = Math.max((v / escala) * PH, 3);
    const xc = plotL + slot * i + slot / 2;
    const hoy = i === ult.length - 1;
    c.fillStyle = hoy ? barCol : barDim;
    imgRedondo(c, xc - barW / 2, plotBot - h, barW, h, 10);
    c.fill();
    c.fillStyle = hoy ? valCol : valDim;
    c.font = `800 ${hoy ? 30 : 26}px ${F}`;
    c.textAlign = "center";
    c.fillText(String(v), xc, plotBot - h - 14);
  });

  // ---- fecha
  const pd = d.dia.split("-");
  const mes3 = MESES_L[+pd[1] - 1].slice(0, 3);
  c.fillStyle = dateCol;
  c.font = `700 34px ${F}`;
  c.textAlign = "center";
  c.fillText(`Jornada · ${+pd[2]} ${mes3} ${pd[0]}`, cx, 1800);
}
