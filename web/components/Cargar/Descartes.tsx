"use client";

import { bonita, type Diagnostico, type FilaDiagDropi, type FilaDiagEffi } from "@/lib/motor";

/**
 * "Qué se descartó": totales de cuentan/descartadas y el detalle fila por fila
 * de cada archivo. Puerto del bloque final de calcular() + detalle()
 * (quin-admin.html:1786-1793, 1817-1828).
 */
const pill = "mr-1.5 rounded-full bg-d-sup-3 px-2 py-0.5 text-[12px] text-d-txt";

function celdaFecha(f: FilaDiagDropi["fecha"]): string {
  if (f instanceof Date) return f.toLocaleString("es-CO");
  return f == null ? "" : String(f);
}

function veredicto(motivo: string | null, jor: string | null): string {
  if (motivo) return `descartada — ${motivo}`;
  return jor ? bonita(jor) : "";
}

function TablaDetalle({
  titulo,
  esDropi,
  filas,
}: {
  titulo: string;
  esDropi: boolean;
  filas: (FilaDiagDropi | FilaDiagEffi)[];
}) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm text-turquesa">{titulo}</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-d-txt-2">
              <th className="px-2 py-1 font-semibold">Fila</th>
              <th className="px-2 py-1 font-semibold">{esDropi ? "Fecha" : "Fecha creación"}</th>
              {esDropi && <th className="px-2 py-1 font-semibold">Hora</th>}
              <th className="px-2 py-1 font-semibold">{esDropi ? "Estatus" : "Vendedor"}</th>
              <th className="px-2 py-1 text-right font-semibold">Cant.</th>
              <th className="px-2 py-1 font-semibold">Cuenta en el día</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => (
              <tr
                key={r.fila}
                className={`border-t border-d-sup-3/50 ${r.motivo ? "text-d-txt-2 opacity-70" : "text-d-txt"}`}
              >
                <td className="px-2 py-1">{r.fila}</td>
                <td className="px-2 py-1">{celdaFecha(r.fecha)}</td>
                {esDropi && (
                  <td className="px-2 py-1">
                    {(() => {
                      const h = (r as FilaDiagDropi).hora;
                      return h == null ? "" : String(h);
                    })()}
                  </td>
                )}
                <td className="px-2 py-1">
                  {esDropi ? (r as FilaDiagDropi).estatus : (r as FilaDiagEffi).vendedor}
                </td>
                <td className="px-2 py-1 text-right tabular-nums">{r.cant}</td>
                <td className="px-2 py-1">{veredicto(r.motivo, r.jor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function Descartes({ diagnostico }: { diagnostico: Diagnostico }) {
  const d = diagnostico;
  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Qué se descartó</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-1.5 text-sm text-d-txt">
          <b>Dropi:</b> <span className={pill}>cuentan {d.contadasDropi}</span>
          <span className={pill}>descartadas {d.descartadasDropi}</span>
          {d.sinFechaDropi > 0 && (
            <span className="text-red-400">
              {d.sinFechaDropi} filas sin fecha/hora legible
            </span>
          )}
        </p>
        <p className="mb-1 text-sm text-d-txt">
          <b>Effi:</b> <span className={pill}>cuentan {d.contadasEffi}</span>
          <span className={pill}>descartadas {d.descartadasEffi}</span>
        </p>
        <TablaDetalle
          titulo={`Ver las ${d.detalleDropi.length} filas de Dropi una por una`}
          esDropi
          filas={d.detalleDropi}
        />
        <TablaDetalle
          titulo={`Ver las ${d.detalleEffi.length} filas de Effi una por una`}
          esDropi={false}
          filas={d.detalleEffi}
        />
      </div>
    </section>
  );
}
