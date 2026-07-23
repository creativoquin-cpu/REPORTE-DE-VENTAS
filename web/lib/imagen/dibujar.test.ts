import { describe, it, expect } from "vitest";
import { dibujarImagen, IMG_W, IMG_H, type Lienzo2D } from "./dibujar";
import { datosImagen } from "@/lib/motor";
import type { JornadaTablero, CifraTablero } from "@/lib/motor";
import type { MetaHistorial } from "@/lib/motor";

/**
 * Puerto de pruebas/test-imagen.js. jsdom no trae canvas, así que se dibuja
 * sobre un lienzo falso que ANOTA cada operación; así se puede comprobar cada
 * número, cada texto y cada barra sin un canvas real.
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
    // Un rectángulo redondeado se dibuja con beginPath + arcTo y luego fill:
    // se reconstruye a partir de los puntos del trazo.
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
// Barras = rectángulos dentro del área de la gráfica (evita confundirlas con
// las franjas de los cuadros o la píldora de la meta).
function barras(ops: Op[], color: string) {
  return ops
    .filter((o): o is Extract<Op, { op: "rect" }> => o.op === "rect" && o.color === color && o.y >= 1000 && o.y + o.h <= 1495 && o.w < 100 && o.h > 1)
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

describe("dibujarImagen · lo que queda escrito (consolidado)", () => {
  const { T } = pintar(JUL, SIN_METAS, "total");

  it("marca, título y fecha del día", () => {
    expect(T).toContain("QUIN");
    expect(T).toContain("Ventas del día");
    expect(T.some((t) => /19-jul/.test(t))).toBe(true);
  });
  it("la cifra grande es el total del día (48) y su meta y faltante", () => {
    expect(T).toContain("48");
    expect(T).toContain("Meta 200 prendas");
    expect(T).toContain("Faltaron 152 para la meta");
  });
  it("los tres cuadros: propias, Dropi y promedio", () => {
    expect(T).toContain("Propias (Effi)");
    expect(T).toContain("40");
    expect(T).toContain("Dropi");
    expect(T).toContain("8");
    expect(T).toContain("Promedio del mes");
    expect(T).toContain("129");
    expect(T).toContain("por día");
  });
  it("el mes día por día con su total y las fechas", () => {
    expect(T.some((t) => t.includes("El mes día por día · julio 2026"))).toBe(true);
    expect(T).toContain("645 prendas en 5 días");
    expect(["200", "150", "47", "48"].every((v) => T.includes(v))).toBe(true);
    expect(["13", "14", "15", "18", "19"].every((v) => T.includes(v))).toBe(true);
  });
  it("leyenda, aviso de reparto y sello de actualización", () => {
    expect(T).toContain("Meta del día");
    expect(T.some((t) => t.includes("repartidos entre sus días"))).toBe(true);
    expect(T.some((t) => t.startsWith("Actualizado"))).toBe(true);
  });
  it("REGLA 9: nunca VS, ranking ni nombres de personas", () => {
    expect(T.some((t) => /\bvs\b|ranking|\bAna\b|Tienda/i.test(t))).toBe(false);
  });
});

describe("dibujarImagen · el día que cumple la meta", () => {
  it("dice 'Meta cumplida' y no 'Faltaron'", () => {
    const soloLunes = { "2026-07-13": jor(150, 60) }; // 210 ≥ meta 200
    const { T } = pintar(soloLunes, SIN_METAS, "total");
    expect(T).toContain("Meta cumplida");
    expect(T.some((t) => t.startsWith("Faltaron"))).toBe(false);
  });
});

describe("dibujarImagen · el desglose cuadra con las barras", () => {
  const { ops } = pintar(JUL, SIN_METAS, "total");
  it("una barra azul y una verde por día, el reportado el último", () => {
    const azules = barras(ops, "#2a78d6");
    const verdes = barras(ops, "#1baf7a");
    expect(azules.length).toBe(5);
    expect(verdes.length).toBe(5);
    expect(Math.round(azules[4].x)).toBeGreaterThan(Math.round(azules[3].x));
  });
});

describe("dibujarImagen · meta escalonada", () => {
  const metas: MetaHistorial[] = [{ id: 1, desde: "2026-07-15", total: 100, propias: 80 }];
  const { ops } = pintar(JUL, metas, "total");
  const lineas = ops.filter((o): o is Extract<Op, { op: "line" }> => o.op === "line" && o.color === "#d03b3b");

  it("un tramo de meta por día", () => {
    expect(lineas.length).toBe(5);
  });
  it("los tramos cambian de altura al cambiar la meta; los dos primeros iguales", () => {
    expect(Math.round(lineas[0].y1)).not.toBe(Math.round(lineas[2].y1));
    expect(Math.round(lineas[0].y1)).toBe(Math.round(lineas[1].y1));
  });
});

describe("dibujarImagen · nada se sale del lienzo (31 días)", () => {
  const largo: Record<string, JornadaTablero> = {};
  for (let i = 1; i <= 31; i++) largo[`2026-07-${String(i).padStart(2, "0")}`] = jor(100 + i, 20);
  const { ops } = pintar(largo, SIN_METAS, "total");

  it("ningún elemento se sale de 1080×1920", () => {
    const fuera = ops.filter((o) => {
      if (o.op === "rect") return o.x < 0 || o.y < 0 || o.x + o.w > IMG_W || o.y + o.h > IMG_H;
      if (o.op === "text") return o.x < 0 || o.y < 0 || o.y > IMG_H;
      if (o.op === "line") return o.y1 < 0 || o.y1 > IMG_H || o.x2 > IMG_W;
      return false;
    });
    expect(fuera).toEqual([]);
  });
  it("siguen saliendo las 31 cantidades y las 31 fechas, sin traslape", () => {
    const nums = ops.filter((o) => o.op === "text" && o.align === "center");
    expect(nums.length).toBe(62);
    const B = barras(ops, "#2a78d6");
    expect(B.length).toBe(31);
    expect(B.every((b, i) => i === 0 || b.x >= B[i - 1].x + B[i - 1].w)).toBe(true);
  });
});

describe("dibujarImagen · imagen de ventas propias", () => {
  const { T, ops } = pintar(JUL, SIN_METAS, "propias");

  it("título, meta de propias y faltante", () => {
    expect(T).toContain("Ventas propias");
    expect(T.some((t) => t.includes("solo Effi"))).toBe(true);
    expect(T).toContain("40"); // cifra grande = propias del día
    expect(T).toContain("Meta 160 prendas");
    expect(T).toContain("Faltaron 120 para la meta");
  });
  it("cuadros de total, promedio y días en meta del mes", () => {
    expect(T).toContain("Total del mes");
    expect(T).toContain("490");
    expect(T).toContain("98");
    expect(T).toContain("Días en meta");
    expect(T).toContain("0 de 5");
  });
  it("el pie aclara que no incluye Dropi y la gráfica es de propias", () => {
    expect(T.some((t) => t.includes("No incluye Dropi"))).toBe(true);
    expect(T.some((t) => t === "490 prendas en 5 días")).toBe(true);
  });
  it("solo barras azules, ninguna verde de Dropi", () => {
    expect(barras(ops, "#2a78d6").length).toBe(5);
    expect(barras(ops, "#1baf7a").length).toBe(0);
  });
  it("REGLA 9: nunca nombres de personas", () => {
    expect(T.some((t) => /\bAna\b|\bVS\b|TiendaX/.test(t))).toBe(false);
  });
});
