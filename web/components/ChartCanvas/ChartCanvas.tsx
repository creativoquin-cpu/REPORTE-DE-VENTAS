"use client";

import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

interface ChartCanvasProps {
  config: ChartConfiguration;
  className?: string;
}

/**
 * Envoltorio de Chart.js con ciclo de vida correcto: crea la instancia al
 * montar y la destruye al desmontar o cuando cambia `config`.
 *
 * Esto arregla de raíz el bug de fuga de memoria documentado en
 * quin-admin.html:2066-2069 (paso 10.2): ahí `new Chart(...)` se llamaba
 * sin destruir la instancia anterior al reemplazar a mano el HTML del
 * contenedor, y las gráficas viejas seguían vivas reaccionando al scroll.
 * Acá el cleanup de useEffect garantiza el destroy() en cada
 * desmontaje/actualización, así que ese bug ya no puede volver a pasar.
 */
export function ChartCanvas({ config, className }: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current = new Chart(canvasRef.current, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [config]);

  return <canvas ref={canvasRef} className={className} />;
}
