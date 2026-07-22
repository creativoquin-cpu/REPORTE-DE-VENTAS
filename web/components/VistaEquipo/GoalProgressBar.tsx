"use client";

import { useEffect, useState } from "react";

interface GoalProgressBarProps {
  actual: number;
  meta: number;
}

/**
 * Puerto de animarBarras() (index.html:258-267) + el marcado de
 * .meta-card (index.html:361-369). Meta del EQUIPO, nunca individual
 * (ver docs/BUSINESS-RULES.md regla 9).
 */
export function GoalProgressBar({ actual, meta }: GoalProgressBarProps) {
  const pct = meta > 0 ? Math.min(100, Math.round((actual / meta) * 100)) : 0;
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setAncho(pct), 90);
    return () => clearTimeout(id);
  }, [pct]);

  const cumplida = actual >= meta;

  return (
    <div>
      <p className="mb-2.5 text-2xl font-black tracking-tight tabular-nums text-tinta">
        {actual} de {meta} prendas
      </p>
      <div className="h-3.5 overflow-hidden rounded-full bg-linea">
        <div
          className="h-full rounded-full bg-gradient-to-r from-turquesa to-turquesa-osc transition-[width] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${ancho}%` }}
        />
      </div>
      <div className="mt-3">
        <span className="inline-block rounded-full bg-menta-3 px-4 py-1.5 text-sm font-extrabold tabular-nums text-turquesa-prof">
          {cumplida ? "Meta cumplida" : `Faltan ${meta - actual}`}
        </span>
      </div>
      <p className="mt-3 text-sm text-gris">Esta es una meta del equipo, no una meta individual.</p>
    </div>
  );
}
