import { describe, it, expect } from "vitest";
import { dibujarImagen, IMG_W, IMG_H, type Lienzo2D } from "./dibujar";
import { datosImagen } from "@/lib/motor";
import type { JornadaTablero, CifraTablero } from "@/lib/motor";
import type { MetaHistorial } from "@/lib/motor";

/**
 * Puerto de pruebas/test-imagen.js, actualizado al rediseño "story". jsdom no
 * trae canvas, así que se dibuja sobre un lienzo falso que ANOTA cada operación;
 * así se comprueba cada número, cada texto y cada barra sin un canvas real.
 */
type Op =
  | { op: "rect"; x: number; y: number; w: number; h: number; color: string; redondo?: boolean }
  | { op: "text"; t: string; x: number; y: number; color: string; font: string; align: string }
  | { op: "line"; x1: number; y1: number; x2: number; y2: number; color: string; w: number; dash: number[] | null }
  | { op: "img"; x: number; y: number; w: number; h: number };

function lienzoFalso(): { ctx: Lienzo2D; ops: Op[] } {
  const ops: Op[] = [];
  let pts: Array<[number, number]> = [];
  let px = 0;
  let py = 0;
  let dash: number[] | null = null;
  const ctx: Lienzo2D = {
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    font: "10px sans",
    textAlign: "left",
    textBaseline: "alphabetic",
    fillRect(x, y, w, h) {
      ops.push({ op: "rect", x, y, w, h, color: this.fillStyle });
    },
    fillText(t, x, y) {
      ops.push({ op: "text", t: String(t), x, y, color: this.fillStyle, font: this.font, align: this.textAlign });
    },
    measureText(t) {
      const size = parseInt((this.font.match(/(\d+)px/) as RegExpMatchArray)[1], 10);
      return { width: String(t).length * size * 0.55 };
    },
    beginPath() {
      pts = [];
    },
    closePath() {},
    moveTo(x, y) {
      px = x;
      py = y;
      pts.push([x, y]);
    },
    lineTo(x, y) {
      ops.push({ op: "line", x1: px, y1: py, x2: x, y2: y, color: this.strokeStyle, w: this.lineWidth, dash });
      px = x;
      py = y;
      pts.push([x, y]);
    },
    arcTo(x1, y1, x2, y2) {
      px = x1;
      py = y1;
      pts.push([x1, y1], [x2, y2]);
    },
    fill() {
      if (!pts.length) return;
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      ops.push({ op: "rect", x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, color: this.fillStyle, redondo: true });
      pts = [];
    },
    stroke() {},
    save() {},
    restore() {},
    setLineDash(d) {
      dash = d && d.length ? d : null;
    },
    drawImage(_im, x, y, w, h) {
      ops.push({ op: "img", x, y, w, h });
    },
  };
  return { ctx, ops };
}

function textos(ops: Op[]): string[] {
  return ops.filter((o): o is Extract<Op, { op: "text" }> => o.op === "text").map((o) => o.t);
}
// Barras del mini-gráfico: rectángulos redondeados, angostos, dentro del área
// de la caja (y ≥ 980). Excluye la caja (ancha) y las franjas del gradiente.
function barras(ops: Op[], colores: string[]) {
  return ops
    .filter(
      (o): o is Extract<Op, { op: "rect" }> =>
        o.op === "rect" && o.redondo === true && colores.includes(o.color) && o.y >= 980 && o.w < 100 && o.h > 1
    )
    .sort((a, b) => a.x - b.x);
}

function jor(p: number, d: number): JornadaTablero {
  return { propias: p, dropi: d, ven: { Ana: p }, tie: { TiendaX: d } };
}
const JUL: Record<string, JornadaTablero> = {
  "2026-07-13": jor(150, 50),
  "2026-07-14": jor(140, 60),
  "2026-07-15": jor(120, 30),
  "2026-07-18": jor(60, 11),
  "2026-07-19": jor(20, 4),
};
const SIN_CALC: Record<string, CifraTablero> = {};
const SIN_METAS: MetaHistorial[] = [];

function pintar(jornadas: Record<string, JornadaTablero>, metas: MetaHistorial[], modo: "total" | "propias") {
  const d = datosImagen(jornadas, SIN_CALC, metas, "2026-07")!;
  const { ctx, ops } = lienzoFalso();
  dibujarImagen(ctx, d, null, modo);
  return { d, ops, T: textos(ops) };
}

describe("dibujarImagen · tarjeta TOTAL", () => {
  const { T, ops } = pintar(JUL, SIN_METAS, "total");

  it("marca, meta, cifra grande del día, unidad y fecha", () => {
    expect(T).toContain("AGENCIA QUIN · TOTAL");
    expect(T).toContain("Meta 200");
    expect(T).toContain("48"); // total repartido del último día (60+20)/2 + (11+4)/2
    expect(T).toContain("prendas del día");
    expect(T.some((t) => /19 jul 2026/.test(t))).toBe(true);
  });
  it("el mini-gráfico muestra la cabecera de últimos 7 días con la meta", () => {
    expect(T).toContain("Últimos 7 días · meta 200");
  });
  it("una barra por día (5), la del día resaltada en teal sólido", () => {
    const solidas = barras(ops, ["#007a72"]);
    const apagadas = barras(ops, ["rgba(0,122,114,0.5)"]);
    expect(solidas.length).toBe(1); // solo el último día va sólido
    expect(apagadas.length).toBe(4);
    // la sólida (hoy) está a la derecha de todas las apagadas
    expect(solidas[0].x).toBeGreaterThan(apagadas[apagadas.length - 1].x);
  });
  it("hay una línea de meta punteada", () => {
    const lineas = ops.filter((o): o is Extract<Op, { op: "line" }> => o.op === "line" && !!o.dash);
    expect(lineas.length).toBeGreaterThanOrEqual(1);
  });
  it("REGLA 9: nunca VS, ranking ni nombres de personas/tiendas", () => {
    expect(T.some((t) => /\bvs\b|ranking|\bAna\b|Tienda/i.test(t))).toBe(false);
  });
});

describe("dibujarImagen · tarjeta PROPIAS", () => {
  const { T, ops } = pintar(JUL, SIN_METAS, "propias");

  it("marca de propias, su meta, cifra y unidad", () => {
    expect(T).toContain("AGENCIA QUIN · PROPIAS");
    expect(T).toContain("Meta 160");
    expect(T).toContain("40"); // propias repartidas del último día
    expect(T).toContain("prendas propias · Effi");
    expect(T).toContain("Últimos 7 días · meta 160");
  });
  it("las barras van en teal de la marca (no el oscuro del total)", () => {
    const bs = barras(ops, ["#00a89d", "rgba(0,168,157,0.5)"]);
    expect(bs.length).toBe(5);
    expect(barras(ops, ["#007a72"]).length).toBe(0);
  });
  it("REGLA 9: nunca nombres de personas ni tiendas", () => {
    expect(T.some((t) => /\bAna\b|\bVS\b|TiendaX/.test(t))).toBe(false);
  });
});

describe("dibujarImagen · el mini-gráfico se limita a 7 días y no se sale", () => {
  const largo: Record<string, JornadaTablero> = {};
  for (let i = 1; i <= 31; i++) largo[`2026-07-${String(i).padStart(2, "0")}`] = jor(100 + i, 20);
  const { ops } = pintar(largo, SIN_METAS, "total");

  it("como mucho 7 barras aunque el mes tenga 31 días", () => {
    const bs = barras(ops, ["#007a72", "rgba(0,122,114,0.5)"]);
    expect(bs.length).toBe(7);
  });
  it("ningún elemento se sale de 1080×1920", () => {
    const fuera = ops.filter((o) => {
      if (o.op === "rect") return o.x < -0.5 || o.y < -0.5 || o.x + o.w > IMG_W + 0.5 || o.y + o.h > IMG_H + 0.5;
      if (o.op === "text") return o.x < 0 || o.y < 0 || o.y > IMG_H;
      if (o.op === "line") return o.y1 < 0 || o.y1 > IMG_H || o.x2 > IMG_W;
      return false;
    });
    expect(fuera).toEqual([]);
  });
});
