"use client";

import { bonita, type ResultadoCalculo } from "@/lib/motor";

/**
 * "Lo que trae el archivo": total de prendas, días, meses y rango de fechas.
 * Puerto de la tarjeta #resumenCarga (quin-admin.html:1763-1776). El conteo
 * de "sin cerrar" depende de las jornadas de la nube, así que llega en 4b.
 */
export function ResumenCarga({ resultado }: { resultado: ResultadoCalculo }) {
  const { dias, claves } = resultado;
  const tP = claves.reduce((a, k) => a + dias[k].propias, 0);
  const tD = claves.reduce((a, k) => a + dias[k].dropi, 0);
  const meses = new Set(claves.map((k) => k.slice(0, 7))).size;

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
        {tP} propias · {tD} Dropi
      </p>
    </div>
  );
}
