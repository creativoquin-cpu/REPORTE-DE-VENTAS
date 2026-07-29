"use client";

import { useMemo } from "react";
import type { ChartConfiguration, Plugin } from "chart.js/auto";
import { ChartCanvas, ySinSolape, type CajaTexto } from "@/components/ChartCanvas";
import { bonita, fdate, DIAS } from "@/lib/motor/fechas";

interface TeamChartProps {
  claves: string[];
  /** Propias por día ya repartidas (alineado con claves). */
  porDia: number[];
  /** Meta de propias por día (alineado con claves). */
  metaPorDia: number[];
}

const NOMBRE_DIA: Record<(typeof DIAS)[number], string> = {
  dom: "Domingo",
  lun: "Lunes",
  mar: "Martes",
  mié: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sáb: "Sábado",
};

const META_COLOR = "#091315"; // tinta, igual al swatch de la leyenda

/**
 * Gráfica "Cómo va el equipo" — puerto de vendGraficaEquipo() (index.html:268-287).
 * Barras de propias por día, con el número de día y el nombre del día en el eje,
 * la cantidad encima de cada barra y la línea de meta del equipo dibujada (mismo
 * patrón que TableroChart). El destroy() de la instancia lo garantiza
 * <ChartCanvas/> (arregla la fuga del paso 10.2).
 */
export function TeamChart({ claves, porDia, metaPorDia }: TeamChartProps) {
  const config = useMemo<ChartConfiguration>(() => {
    const etiquetas = claves.map((k) => {
      const p = k.split("-");
      const dia = DIAS[fdate(k).getDay()];
      return [p[2], NOMBRE_DIA[dia]];
    });
    const metaMax = metaPorDia.length ? Math.max(...metaPorDia) : 0;

    const extras: Plugin<"bar"> = {
      id: "extrasEquipo",
      afterDatasetsDraw(c) {
        const ctx = c.ctx;
        const barras = c.getDatasetMeta(0).data;
        if (!barras.length) return;

        const colocadas: CajaTexto[] = [];

        // Cantidad encima de cada barra (va primero: es el dato principal,
        // la línea de meta cede el paso si choca con un número).
        ctx.save();
        ctx.font = "800 13px -apple-system,Segoe UI,Roboto,sans-serif";
        ctx.fillStyle = "#091315";
        ctx.textAlign = "center";
        barras.forEach((b, i) => {
          if (!porDia[i]) return;
          const texto = String(porDia[i]);
          const w = ctx.measureText(texto).width;
          const y = b.y - 6;
          ctx.fillText(texto, b.x, y);
          colocadas.push({ x: b.x - w / 2, y, w, h: 13 });
        });
        ctx.restore();

        // Línea de meta del equipo, un tramo por día (la meta puede cambiar
        // a mitad de mes), rotulada cada vez que cambia el valor.
        const medio =
          barras.length > 1
            ? Math.abs(barras[1].x - barras[0].x) / 2
            : (c.chartArea.right - c.chartArea.left) / 2;

        ctx.save();
        ctx.strokeStyle = META_COLOR;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        barras.forEach((b, i) => {
          const y = c.scales.y.getPixelForValue(metaPorDia[i]);
          if (y < c.chartArea.top || y > c.chartArea.bottom) return;
          ctx.moveTo(Math.max(b.x - medio, c.chartArea.left), y);
          ctx.lineTo(Math.min(b.x + medio, c.chartArea.right), y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "700 11px -apple-system,Segoe UI,Roboto,sans-serif";
        ctx.fillStyle = META_COLOR;
        ctx.textAlign = "left";
        barras.forEach((b, i) => {
          if (i && metaPorDia[i] === metaPorDia[i - 1]) return;
          const yLinea = c.scales.y.getPixelForValue(metaPorDia[i]);
          if (yLinea < c.chartArea.top || yLinea > c.chartArea.bottom) return;
          const texto = `Meta ${metaPorDia[i]}`;
          const x = Math.max(b.x - medio + 2, c.chartArea.left + 2);
          const w = ctx.measureText(texto).width;
          const y = Math.max(
            ySinSolape({ x, y: yLinea - 5, w, h: 11 }, colocadas),
            c.chartArea.top + 11
          );
          ctx.fillText(texto, x, y);
          colocadas.push({ x, y, w, h: 11 });
        });
        ctx.restore();
      },
    };

    return {
      type: "bar",
      data: {
        labels: etiquetas,
        datasets: [
          {
            label: "Propias del equipo",
            data: porDia,
            backgroundColor: "#00a89d",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 22 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => bonita(claves[items[0].dataIndex]),
              footer: (items) => {
                const x = items[0].dataIndex;
                const v = porDia[x];
                const m = metaPorDia[x];
                return `Meta del equipo ${m} (${v >= m ? "cumplida" : "faltan " + (m - v)})`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { autoSkip: false, font: { size: 11 }, color: "#607174" },
          },
          y: {
            beginAtZero: true,
            suggestedMax: Math.ceil(metaMax * 1.12) || undefined,
            grid: { color: "#e8f0ef" },
            ticks: { font: { size: 11 }, color: "#607174" },
          },
        },
      },
      plugins: [extras],
    };
  }, [claves, porDia, metaPorDia]);

  return (
    <div className="relative h-[300px] w-full">
      <ChartCanvas config={config} className="!h-full !w-full" />
    </div>
  );
}
