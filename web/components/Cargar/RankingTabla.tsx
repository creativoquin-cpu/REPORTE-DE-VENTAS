"use client";

import { SIN_TIENDA } from "@/lib/motor";

/**
 * Ranking por prendas (vendedores de Effi o tiendas de Dropi). Puerto de
 * rankingHTML() (quin-admin.html:1798-1815). "Tienda no identificada" va
 * suelta, sin puesto (—) y en rojo. Effi y Dropi nunca se mezclan.
 */
interface RankingTablaProps {
  titulo: string;
  mapa: Record<string, number>;
  etiqueta: string;
  aclaracion: string;
}

export function RankingTabla({ titulo, mapa, etiqueta, aclaracion }: RankingTablaProps) {
  const filas = Object.keys(mapa)
    .map((nom) => ({ nom, n: mapa[nom] }))
    .sort((a, b) => b.n - a.n);

  let pos = 0;

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">{titulo}</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-2.5 text-[13px] text-d-txt-2">{aclaracion}</p>
        {filas.length === 0 ? (
          <p className="text-d-txt-2">Sin datos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-d-sup-3 text-left text-[12px] uppercase tracking-wide text-d-txt-2">
                <th className="py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-2 font-semibold">{etiqueta}</th>
                <th className="py-2 text-right font-semibold">Prendas</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((x) => {
                const suelto = x.nom === SIN_TIENDA;
                if (!suelto) pos++;
                const primero = pos === 1 && !suelto;
                return (
                  <tr
                    key={x.nom}
                    className={`border-b border-d-sup-3/50 ${primero ? "bg-turquesa/10" : ""}`}
                  >
                    <td className="py-2 pr-2 text-d-txt-2">
                      {suelto ? "—" : primero ? "🏆 1" : pos}
                    </td>
                    <td className={`py-2 pr-2 ${suelto ? "text-red-400" : "text-d-txt"}`}>
                      {x.nom}
                    </td>
                    <td className="py-2 text-right font-bold text-d-txt">{x.n}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
