"use client";

import { MESES, bonita, repartir, type ResultadoCalculo } from "@/lib/motor";

/**
 * "Prendas por día": REAL (lo que cayó ese día) vs REPARTIDA (el fin de semana
 * o festivo repartido entre sus días), con el pie de totales y los bloques
 * encontrados. Puerto de la tabla de calcular() (quin-admin.html:1717-1756).
 */
const cel = "px-2 py-1.5 text-right tabular-nums";
const rep = "bg-turquesa/10";

export function TablaPorDia({ resultado }: { resultado: ResultadoCalculo }) {
  const { dias, claves, bloques } = resultado;
  const totales = claves.reduce(
    (a, k) => {
      const v = dias[k];
      a.tP += v.propias;
      a.tD += v.dropi;
      a.trP += v.repP;
      a.trD += v.repD;
      return a;
    },
    { tP: 0, tD: 0, trP: 0, trD: 0 }
  );

  const tabla = (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[12px] text-d-txt-2">
          <th rowSpan={2} className="px-2 py-1.5 text-left font-semibold">
            Fecha
          </th>
          <th rowSpan={2} className="px-2 py-1.5 text-left font-semibold">
            Día
          </th>
          <th rowSpan={2} className="px-2 py-1.5 text-left font-semibold">
            Estado
          </th>
          <th colSpan={3} className="px-2 py-1.5 text-center font-semibold">
            REAL
          </th>
          <th colSpan={3} className={`px-2 py-1.5 text-center font-semibold ${rep}`}>
            REPARTIDA
          </th>
        </tr>
        <tr className="text-[12px] text-d-txt-2">
          <th className={cel}>Prop.</th>
          <th className={cel}>Dropi</th>
          <th className={cel}>Total</th>
          <th className={`${cel} ${rep}`}>Prop.</th>
          <th className={`${cel} ${rep}`}>Dropi</th>
          <th className={`${cel} ${rep}`}>Total</th>
        </tr>
      </thead>
      <tbody>
        {claves.map((k) => {
          const v = dias[k];
          const p = k.split("-");
          const esB = v.motivo != null;
          return (
            <tr
              key={k}
              className={`border-t border-d-sup-3/50 ${esB ? "bg-turquesa/[0.06]" : ""}`}
            >
              <td className="px-2 py-1.5 text-d-txt">
                {p[2]}-{MESES[+p[1] - 1]}
              </td>
              <td className="px-2 py-1.5 text-d-txt-2">{bonita(k).split(" ")[0]}</td>
              <td className={`px-2 py-1.5 text-[12px] ${esB ? "text-amber-400" : "text-d-txt-2"}`}>
                {esB ? v.motivo : "laborable"}
              </td>
              <td className={`${cel} text-d-txt`}>{v.propias}</td>
              <td className={`${cel} text-d-txt`}>{v.dropi}</td>
              <td className={`${cel} font-bold text-d-txt`}>{v.propias + v.dropi}</td>
              <td className={`${cel} ${rep} text-d-txt`}>{v.repP}</td>
              <td className={`${cel} ${rep} text-d-txt`}>{v.repD}</td>
              <td className={`${cel} ${rep} font-bold text-d-txt`}>{v.repP + v.repD}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-d-sup-3 font-bold text-d-txt">
          <td colSpan={3} className="px-2 py-1.5">
            TOTAL
          </td>
          <td className={cel}>{totales.tP}</td>
          <td className={cel}>{totales.tD}</td>
          <td className={cel}>{totales.tP + totales.tD}</td>
          <td className={`${cel} ${rep}`}>{totales.trP}</td>
          <td className={`${cel} ${rep}`}>{totales.trD}</td>
          <td className={`${cel} ${rep}`}>{totales.trP + totales.trD}</td>
        </tr>
      </tfoot>
    </table>
  );

  const listaBloques = bloques.length > 0 && (
    <div className="mt-3 text-[13px] text-d-txt-2">
      <p className="mb-1.5 font-semibold text-d-txt">Bloques encontrados</p>
      {bloques.map((b, i) => (
        <p key={i} className="mb-1.5">
          <span className="mr-1.5 rounded-full bg-d-sup-3 px-2 py-0.5 text-[12px] text-d-txt">
            {b.dias.length} día{b.dias.length > 1 ? "s" : ""}
          </span>
          {b.dias.map(bonita).join(" + ")} → propias {b.sumaP} en [
          {repartir(b.sumaP, b.dias.length).join(", ")}] · Dropi {b.sumaD} en [
          {repartir(b.sumaD, b.dias.length).join(", ")}]
        </p>
      ))}
    </div>
  );

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Prendas por día</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-3 text-[13px] text-d-txt-2">
          <b className="text-d-txt">Real</b> = lo que cayó ese día.{" "}
          <b className="text-d-txt">Repartida</b> = el fin de semana o festivo repartido entre sus
          días.
        </p>
        <div className="overflow-x-auto">
          {claves.length > 40 ? (
            <details>
              <summary className="cursor-pointer text-sm text-turquesa">
                Ver la tabla día por día ({claves.length} días)
              </summary>
              <div className="mt-2">{tabla}</div>
            </details>
          ) : (
            tabla
          )}
        </div>
        {bloques.length > 8 ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-turquesa">
              Bloques encontrados ({bloques.length})
            </summary>
            {listaBloques}
          </details>
        ) : (
          listaBloques
        )}
      </div>
    </section>
  );
}
