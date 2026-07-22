"use client";

import { useMemo } from "react";
import type { ChartConfiguration } from "chart.js/auto";
import { ChartCanvas } from "@/components/ChartCanvas";
import { bonita } from "@/lib/motor/fechas";

interface TeamChartProps {
  claves: string[];
  /** Propias por día ya repartidas (alineado con claves). */
  porDia: number[];
  /** Meta de propias por día (alineado con claves). */
  metaPorDia: number[];
}

/**
 * Gráfica "Cómo va el equipo" — puerto de vendGraficaEquipo() (index.html:268-287).
 * Barras de propias por día con la meta del equipo en el tooltip. El destroy()
 * de la instancia lo garantiza <ChartCanvas/> (arregla la fuga del paso 10.2).
 */
export function TeamChart({ claves, porDia, metaPorDia }: TeamChartProps) {
  const config = useMemo<ChartConfiguration>(
    () => ({
      type: "bar",
      data: {
        labels: claves.map((k) => k.split("-")[2]),
        datasets: [
          {
            label: "Propias del equipo",
            data: porDia,
            backgroundColor: "#17c3c3",
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
            suggestedMax: metaPorDia.length ? Math.max(...metaPorDia) : undefined,
            grid: { color: "#e8f0ef" },
            ticks: { font: { size: 11 }, color: "#607174" },
          },
        },
      },
    }),
    [claves, porDia, metaPorDia]
  );

  return (
    <div className="relative h-[300px] w-full">
      <ChartCanvas config={config} className="!h-full !w-full" />
    </div>
  );
}
