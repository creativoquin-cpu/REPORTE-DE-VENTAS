"use client";

import { resumenVigencia } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";

/**
 * "Venta real vs oficial" de Effi: separa lo remitido (oficial) de lo vigente
 * (real) usando la columna Vigencia, y lista los motivos de las anuladas.
 * Sirve igual para la subida del día o para el consolidado del mes: describe
 * el archivo que esté cargado. Solo aparece cuando hay filas de Effi.
 */
function Kpi({
  label,
  valor,
  extra,
  tono,
}: {
  label: string;
  valor: number;
  extra?: string;
  tono: "real" | "oficial" | "anul";
}) {
  const color =
    tono === "real" ? "text-turquesa-prof" : tono === "anul" ? "text-amber-500" : "text-d-txt";
  return (
    <div className="rounded-card-sm border border-d-sup-3 bg-d-bg p-3.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-d-txt-3">{label}</p>
      <p className={`text-[26px] font-black leading-tight ${color}`}>{valor}</p>
      {extra && <p className="text-[12px] text-d-txt-2">{extra}</p>}
    </div>
  );
}

export function ResumenVigencia() {
  const { filasEffi } = useCargar();
  const r = resumenVigencia(filasEffi);
  if (r.remitido === 0) return null;

  const pct = Math.round((r.anuladas / r.remitido) * 100);

  return (
    <div className="rounded-card border border-d-sup-3 bg-d-sup p-5 shadow-card">
      <div className="mb-3">
        <p className="eyebrow">Effi · venta real vs oficial</p>
        <h3 className="text-lg font-black text-d-txt">Vigencia de remisiones</h3>
        <p className="text-[13px] text-d-txt-2">
          La venta <b>real</b> son solo las remisiones vigentes; las anuladas no cuentan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Venta real (vigentes)" valor={r.real} tono="real" />
        <Kpi label="Oficial / remitido" valor={r.remitido} tono="oficial" />
        <Kpi
          label="Anuladas"
          valor={r.anuladas}
          extra={`${r.filasAnuladas} remisión${r.filasAnuladas === 1 ? "" : "es"} · ${pct}% del total`}
          tono="anul"
        />
      </div>

      {r.motivos.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[13px] font-semibold text-d-txt">Motivos de anulación</p>
          <ul className="flex flex-col gap-1 text-[13px] text-d-txt-2">
            {r.motivos.map((m) => (
              <li key={m.motivo} className="flex justify-between gap-3">
                <span className="truncate">{m.motivo}</span>
                <b className="shrink-0 text-d-txt">{m.cantidad}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
