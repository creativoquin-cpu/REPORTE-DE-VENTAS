"use client";

import { useState } from "react";
import { claveFecha, MESES_L, porQueNoLaborable, correrMes, bonita } from "@/lib/motor";

/**
 * Calendario visual para marcar días (Días no laborables / Días sin ventas).
 * Reemplaza el <input type="date"> nativo (que se veía tipo Excel) por un mes
 * navegable con la estética de la marca (tema oscuro del panel), igual que la
 * pestaña "Calendario". Un clic en un día lo elige (marcar o quitar según ya
 * esté marcado); los días marcados en el OTRO panel se muestran atenuados y no
 * se pueden tocar acá (primero se quitan en su panel).
 */
const DOW = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

const btn =
  "rounded-full border border-d-sup-3 px-3 py-1.5 text-[13px] font-semibold text-d-txt-2 hover:bg-d-sup-2";

export function CalendarioMarcar({
  marcados,
  otros = {},
  onElegir,
  color,
}: {
  /** Días marcados en ESTE panel (se resaltan con el color de acento). */
  marcados: Record<string, unknown>;
  /** Días marcados en el OTRO panel (atenuados, no clicables acá). */
  otros?: Record<string, unknown>;
  onElegir: (fecha: string) => void;
  color: "turquesa" | "rojo";
}) {
  const f = new Date();
  const hoyMes = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
  const hoyK = claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate());
  const [mes, setMes] = useState(hoyMes);

  const [ano, m1] = mes.split("-").map(Number);
  const hueco = (new Date(ano, m1 - 1, 1).getDay() + 6) % 7;
  const ultimo = new Date(ano, m1, 0).getDate();

  const acento =
    color === "turquesa"
      ? "border-turquesa bg-turquesa/25 text-d-txt"
      : "border-red-500 bg-red-500/25 text-d-txt";
  const puntoOtro = color === "turquesa" ? "bg-red-400" : "bg-turquesa";

  const celdas = [];
  for (let h = 0; h < hueco; h++) celdas.push(<div key={`h${h}`} />);
  for (let d = 1; d <= ultimo; d++) {
    const k = claveFecha(ano, m1, d);
    const estaMarcado = !!marcados[k];
    const esOtro = !estaMarcado && !!otros[k];
    const nolab = porQueNoLaborable(k, {}) != null; // solo festivos/fin de semana automáticos
    const esHoy = k === hoyK;

    let clase = "border border-d-sup-3 bg-d-sup-2 text-d-txt hover:border-d-txt-2";
    if (estaMarcado) clase = acento;
    else if (esOtro) clase = "border border-d-sup-3 bg-d-sup-3/60 text-d-txt-2 cursor-not-allowed";
    else if (nolab) clase = "border border-d-sup-3 bg-d-sup-3/50 text-d-txt-2 hover:border-d-txt-2";

    celdas.push(
      <button
        key={k}
        type="button"
        onClick={() => !esOtro && onElegir(k)}
        disabled={esOtro}
        title={
          esOtro
            ? `${bonita(k)} — marcado en el otro panel`
            : estaMarcado
              ? `${bonita(k)} — clic para quitar`
              : `${bonita(k)}${nolab ? " — no laborable" : ""} — clic para marcar`
        }
        className={`relative flex min-h-[44px] flex-col rounded-md p-1 text-left transition-colors ${clase}`}
      >
        <span className={`text-[11px] leading-none ${esHoy ? "font-black text-turquesa" : "text-d-txt-2"}`}>
          {d}
        </span>
        {esOtro && <i className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${puntoOtro}`} />}
      </button>
    );
  }

  return (
    <div className="rounded-card-sm border border-d-sup-3 bg-d-sup-2/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <button type="button" className={btn} onClick={() => setMes(correrMes(mes, -1))}>
          ‹
        </button>
        <span className="flex-1 text-center text-sm font-black capitalize text-d-txt">
          {MESES_L[m1 - 1]} {ano}
        </span>
        <button type="button" className={btn} onClick={() => setMes(correrMes(mes, 1))}>
          ›
        </button>
        <button type="button" className={btn} onClick={() => setMes(hoyMes)}>
          Hoy
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DOW.map((dd) => (
          <div key={dd} className="pb-1 text-center text-[11px] font-semibold text-d-txt-2">
            {dd}
          </div>
        ))}
        {celdas}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-d-txt-2">
        <span className="flex items-center gap-1.5">
          <i
            className={`inline-block h-3 w-3 rounded-sm ${color === "turquesa" ? "bg-turquesa/60" : "bg-red-500/50"}`}
          />
          Marcado
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-3 w-3 rounded-sm bg-d-sup-3/60" />
          Sáb/dom/festivo (automático)
        </span>
        <span className="flex items-center gap-1.5">
          <i className={`inline-block h-1.5 w-1.5 rounded-full ${puntoOtro}`} />
          Marcado en el otro panel
        </span>
      </div>
    </div>
  );
}
