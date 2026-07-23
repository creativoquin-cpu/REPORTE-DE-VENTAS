"use client";

import { useMemo } from "react";
import type { ChartConfiguration, Plugin } from "chart.js";
import { ChartCanvas } from "@/components/ChartCanvas";
import { bonita } from "@/lib/motor";

/**
 * Gráfica del tablero: barras apiladas (propias + Dropi) por día, con la línea
 * de meta escalonada (un tramo por día, porque la meta puede cambiar a mitad de
 * mes) y el total encima de cada barra. Puerto de grafica()
 * (quin-admin.html:2078-2151). Los días sin cerrar (bosquejo) van en tono más
 * apagado. Sobre <ChartCanvas>, que garantiza el destroy() (arregla la fuga del
 * paso 10.2).
 */
interface TableroChartProps {
  claves: string[];
  propias: number[];
  dropi: number[];
  cerradas: boolean[];
  metaDia: number[];
}

export function TableroChart({ claves, propias, dropi, cerradas, metaDia }: TableroChartProps) {
  const config = useMemo<ChartConfiguration>(() => {
    const etiquetas = claves.map((k) => k.split("-")[2]);
    const metaMax = metaDia.length ? Math.max(...metaDia) : 200;
    const col = (base: string, claro: string) => (ctx: { dataIndex: number }) =>
      cerradas[ctx.dataIndex] === false ? claro : base;

    const extras: Plugin<"bar"> = {
      id: "extras",
      afterDatasetsDraw(c) {
        const ctx = c.ctx;
        // Totales sobre cada barra.
        ctx.save();
        ctx.font = "800 13px -apple-system,Segoe UI,Roboto,sans-serif";
        ctx.fillStyle = "#eaf4f3";
        ctx.textAlign = "center";
        c.getDatasetMeta(1).data.forEach((b, i) => {
          const t = propias[i] + dropi[i];
          if (t) ctx.fillText(String(t), b.x, b.y - 6);
        });
        ctx.restore();
        // Línea de meta (tope del equipo, viene de "Metas del equipo"): un tramo
        // por día, con el valor rotulado cada vez que la meta cambia.
        const barras = c.getDatasetMeta(1).data;
        if (!barras.length) return;
        const medio =
          barras.length > 1
            ? Math.abs(barras[1].x - barras[0].x) / 2
            : (c.chartArea.right - c.chartArea.left) / 2;
        ctx.save();
        ctx.strokeStyle = "#eaf4f3";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        barras.forEach((b, i) => {
          const y = c.scales.y.getPixelForValue(metaDia[i]);
          if (y < c.chartArea.top || y > c.chartArea.bottom) return;
          ctx.moveTo(Math.max(b.x - medio, c.chartArea.left), y);
          ctx.lineTo(Math.min(b.x + medio, c.chartArea.right), y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        // Rótulo "Meta N" en el primer día y cada vez que cambia el valor.
        ctx.font = "700 11px -apple-system,Segoe UI,Roboto,sans-serif";
        ctx.fillStyle = "#eaf4f3";
        ctx.textAlign = "left";
        barras.forEach((b, i) => {
          if (i && metaDia[i] === metaDia[i - 1]) return;
          const y = c.scales.y.getPixelForValue(metaDia[i]);
          if (y < c.chartArea.top || y > c.chartArea.bottom) return;
          ctx.fillText(`Meta ${metaDia[i]}`, Math.max(b.x - medio + 2, c.chartArea.left + 2), y - 5);
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
            label: "Propias",
            data: propias,
            backgroundColor: col("#17c3c3", "#123b3d"),
            stack: "a",
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
          },
          {
            label: "Dropi",
            data: dropi,
            backgroundColor: col("#5b8f94", "#1d4a3d"),
            stack: "a",
            borderRadius: { topLeft: 9, topRight: 9, bottomLeft: 0, bottomRight: 0 },
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
            backgroundColor: "#14282b",
            titleColor: "#eaf4f3",
            bodyColor: "#eaf4f3",
            footerColor: "#8fa5a7",
            cornerRadius: 12,
            padding: 10,
            displayColors: false,
            callbacks: {
              title: (items) => {
                const x = items[0].dataIndex;
                return bonita(claves[x]) + (cerradas[x] === false ? "  (sin cerrar)" : "");
              },
              footer: (items) => {
                const x = items[0].dataIndex;
                const t = propias[x] + dropi[x];
                const m = metaDia[x];
                return `Total ${t}  ·  meta ${m} (${t >= m ? "cumple" : "faltan " + (m - t)})`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            border: { display: false },
            ticks: { autoSkip: false, font: { size: 11 }, color: "#7d9396" },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            // Aire arriba para que la línea de meta nunca quede pegada al borde
            // superior (si no, cuando la meta es el valor más alto, se recorta).
            suggestedMax: Math.ceil(metaMax * 1.12),
            border: { display: false },
            grid: { color: "rgba(255,255,255,.05)" },
            ticks: { font: { size: 11 }, color: "#7d9396" },
          },
        },
      },
      plugins: [extras],
    };
  }, [claves, propias, dropi, cerradas, metaDia]);

  return (
    <div className="relative h-[320px] w-full">
      <ChartCanvas config={config} />
    </div>
  );
}
