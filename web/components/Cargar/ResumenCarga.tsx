"use client";

import { bonita, type ResultadoCalculo } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";

/**
 * "Lo que trae el archivo": total de prendas, días, meses, rango de fechas y
 * cuántos días siguen sin cerrar. Puerto de la tarjeta #resumenCarga
 * (quin-admin.html:1763-1776).
 */
export function ResumenCarga({ resultado }: { resultado: ResultadoCalculo }) {
  const { jornadas } = useCargar();
  const { dias, claves } = resultado;
  const tP = claves.reduce((a, k) => a + dias[k].propias, 0);
  const tD = claves.reduce((a, k) => a + dias[k].dropi, 0);
  const meses = new Set(claves.map((k) => k.slice(0, 7))).size;
  const pend = claves.filter((k) => !jornadas[k]).length;

  return (
    <div className="flex-1 min-w-[240px] self-start rounded-card-sm border border-turquesa/30 bg-turquesa/10 p-3.5 text-[13px] text-d-txt">
      <p className="mb-1.5 text-sm font-semibold">Lo que trae el archivo</p>
      <p className="mb-0.5">
        <b>{tP + tD}</b> prendas · <b>{claves.length}</b> día{claves.length === 1 ? "" : "s"} ·{" "}
        <b>{meses}</b> mes{meses === 1 ? "" : "es"}
      </p>
      <p className="mb-0.5 text-d-txt-2">
        {claves.length
          ? `${bonita(claves[0])} → ${bonita(claves[claves.length - 1])}`
          : "sin fechas"}
      </p>
      <p className="text-d-txt-2">
        {tP} propias · {tD} Dropi ·{" "}
        {claves.length > 0 &&
          (pend > 0 ? (
            <b className="text-amber-400">{pend} sin cerrar</b>
          ) : (
            <b className="text-emerald-400">todas cerradas</b>
          ))}
      </p>
    </div>
  );
}
