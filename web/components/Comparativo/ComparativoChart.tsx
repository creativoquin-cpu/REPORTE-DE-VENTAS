"use client";

import { useMemo } from "react";
import type { ChartConfiguration, Plugin } from "chart.js";
import { ChartCanvas } from "@/components/ChartCanvas";
import type { ResumenCmp } from "@/lib/motor";

/**
 * Gráfica del comparativo: barras apiladas (propias + Dropi) por mes y una
 * línea con el promedio por día sobre un segundo eje. Puerto de graficaMeses()
 * (quin-admin.html:2587-2623). Sobre <ChartCanvas>, que garantiza el destroy().
 */
export function ComparativoChart({ resumenes, etiquetas }: { resumenes: ResumenCmp[]; etiquetas: string[] }) {
  const config = useMemo<ChartConfiguration>(() => {
    const totales = resumenes.map((r) => r.total);
    const dias = resumenes.map((r) => r.n);

    const totalMes: Plugin<"bar"> = {
      id: "totalMes",
      afterDatasetsDraw(c) {
        const ctx = c.ctx;
        ctx.save();
        ctx.font = "800 12px -apple-system,Segoe UI,Roboto,sans-serif";
        ctx.fillStyle = "#eaf4f3";
        ctx.textAlign = "center";
        c.getDatasetMeta(1).data.forEach((b, i) => {
          if (totales[i]) ctx.fillText(String(totales[i]), b.x, b.y - 6);
        });
        ctx.restore();
      },
    };

    return {
      type: "bar",
      data: {
        labels: etiquetas,
        datasets: [
          { type: "bar", label: "Propias", data: resumenes.map((r) => r.p), backgroundColor: "#17c3c3", stack: "a", yAxisID: "y" },
          {
            type: "bar",
            label: "Dropi",
            data: resumenes.map((r) => r.d),
            backgroundColor: "#1baf7a",
            stack: "a",
            borderRadius: 4,
            yAxisID: "y",
          },
          {
            type: "line",
            label: "Promedio por día",
            data: resumenes.map((r) => r.prom),
            borderColor: "#e0a030",
            backgroundColor: "#e0a030",
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.25,
            yAxisID: "y2",
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
            callbacks: {
              footer: (items) => {
                const x = items[0].dataIndex;
                return `Total ${totales[x]} · ${dias[x]} día${dias[x] === 1 ? "" : "s"}`;
              },
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 }, color: "#7d9396" } },
          y: {
            stacked: true,
            beginAtZero: true,
            border: { display: false },
            grid: { color: "rgba(255,255,255,.08)" },
            ticks: { font: { size: 11 }, color: "#7d9396" },
          },
          y2: {
            position: "right",
            beginAtZero: true,
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 }, color: "#e0a030" },
          },
        },
      },
      plugins: [totalMes],
    };
  }, [resumenes, etiquetas]);

  return (
    <div className="relative h-[320px] w-full">
      <ChartCanvas config={config} />
    </div>
  );
}
