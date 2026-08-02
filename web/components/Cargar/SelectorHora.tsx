"use client";

import { useEffect, useRef, useState } from "react";

const HORAS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTOS = Array.from({ length: 60 }, (_, i) => i); // 0..59
const AMPM = ["a. m.", "p. m."] as const;
type Ampm = (typeof AMPM)[number];

function a24(h12: number, ampm: Ampm): number {
  if (ampm === "a. m.") return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function a12(h24: number): { h12: number; ampm: Ampm } {
  const ampm: Ampm = h24 < 12 ? "a. m." : "p. m.";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { h12, ampm };
}

function opcionCls(activo: boolean): string {
  return `w-full rounded-md px-2 py-1 text-left text-[13px] font-semibold tabular-nums ${
    activo ? "bg-turquesa text-d-en-turquesa" : "text-d-txt-2 hover:bg-d-sup-3/60"
  }`;
}

/**
 * Selector de hora con la estética de la marca (mismo layout de 3 columnas —
 * hora / minuto / a.m.·p.m. — que el popup nativo del navegador para
 * <input type="time">, pero temado). El popup nativo es UI del sistema: no se
 * puede recolorear con CSS, así que acá se reconstruye a mano.
 */
export function SelectorHora({
  value,
  onChange,
}: {
  /** "HH:MM" en 24 horas. */
  value: string;
  onChange: (v: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);
  const horaRef = useRef<HTMLButtonElement>(null);
  const minRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    horaRef.current?.scrollIntoView({ block: "center" });
    minRef.current?.scrollIntoView({ block: "center" });
  }, [abierto]);

  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  const { h12, ampm } = a12(m ? +m[1] : 0);
  const minuto = m ? +m[2] : 0;

  function elegir(nh12: number, nmin: number, nampm: Ampm) {
    const h24 = a24(nh12, nampm);
    onChange(`${String(h24).padStart(2, "0")}:${String(nmin).padStart(2, "0")}`);
  }

  return (
    <div ref={cajaRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="mt-1 flex w-[120px] items-center justify-between rounded-lg border border-d-sup-3 bg-d-sup-2 px-2.5 py-1.5 text-sm text-d-txt outline-none hover:border-turquesa focus:outline-2 focus:outline-turquesa"
      >
        <span className="tabular-nums">
          {String(h12).padStart(2, "0")}:{String(minuto).padStart(2, "0")} {ampm}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-d-txt-2">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {abierto && (
        <div className="absolute z-20 mt-1 flex w-[210px] gap-1 rounded-card-sm border border-d-sup-3 bg-d-sup p-2 shadow-card">
          <div className="max-h-[200px] flex-1 overflow-y-auto">
            {HORAS.map((h) => (
              <button
                key={h}
                type="button"
                ref={h === h12 ? horaRef : undefined}
                onClick={() => elegir(h, minuto, ampm)}
                className={opcionCls(h === h12)}
              >
                {String(h).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="max-h-[200px] flex-1 overflow-y-auto">
            {MINUTOS.map((mi) => (
              <button
                key={mi}
                type="button"
                ref={mi === minuto ? minRef : undefined}
                onClick={() => elegir(h12, mi, ampm)}
                className={opcionCls(mi === minuto)}
              >
                {String(mi).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="flex-1">
            {AMPM.map((ap) => (
              <button
                key={ap}
                type="button"
                onClick={() => {
                  elegir(h12, minuto, ap);
                  setAbierto(false);
                }}
                className={opcionCls(ap === ampm)}
              >
                {ap}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
