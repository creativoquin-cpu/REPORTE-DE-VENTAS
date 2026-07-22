"use client";

import { estadoMes, resumenMensualCerrado, MESES_L } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";

/**
 * Panel "Cierre mensual" (Fase 4b-1, SOLO LECTURA). Puerto de pintarCierre()
 * (quin-admin.html:1249-1342) sin los botones que escriben: muestra cada mes
 * con jornadas o sello, su estado (cerrado / reabierto / en curso / pendiente),
 * el total de hoy vs lo sellado y la bitácora de cierres.
 *
 * Cerrar/reabrir a mano y el sellado automático llegan en 4b-2.
 */
function nombreMes(m: string): string {
  const [ano, mes1] = m.split("-").map(Number);
  return `${MESES_L[mes1 - 1]} ${ano}`;
}

const th = "px-2 py-1.5 text-left text-[12px] font-semibold uppercase tracking-wide text-d-txt-2";
const td = "px-2 py-1.5 text-d-txt";

export function CierrePanel() {
  const { jornadas, meses } = useCargar();

  const mesActual = (() => {
    const f = new Date();
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
  })();

  const set = new Set<string>();
  Object.keys(jornadas).forEach((k) => set.add(k.slice(0, 7)));
  Object.keys(meses).forEach((m) => set.add(m));
  const listaM = [...set].sort().reverse();

  const conTraza = listaM.filter((m) => (meses[m]?.datos.traza ?? []).length > 0);

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Cierre mensual</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-3 text-[13px] text-d-txt-2">
          Cada mes se cierra <b className="text-d-txt">solo</b> la primera vez que se abre la app el
          mes siguiente. Al cerrarse, su resumen queda <b className="text-d-txt">sellado</b> y ya no
          cambia. Cerrar/reabrir a mano llega en la próxima sub-entrega.
        </p>

        {!listaM.length ? (
          <p className="text-d-txt-2">Todavía no hay ningún mes con jornadas cerradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Mes</th>
                  <th className={th}>Días</th>
                  <th className={th}>Total</th>
                  <th className={th}>Sellado</th>
                  <th className={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {listaM.map((m) => {
                  const e = meses[m];
                  const est = estadoMes(m, e?.datos, mesActual);
                  const r = resumenMensualCerrado(jornadas, m);
                  const sellado = est === "cerrado" ? e?.datos.resumen?.total ?? null : null;
                  const dif = sellado != null ? r.total - sellado : null;

                  let texto = "";
                  let color = "text-d-txt-2";
                  if (est === "cerrado") {
                    texto = `Cerrado ${e?.datos.auto ? "solo" : "a mano"} el ${e?.datos.cerrado ?? ""}`;
                    color = "text-emerald-400";
                  } else if (est === "reabierto") {
                    texto = "Reabierto — no se cierra solo";
                    color = "text-amber-400";
                  } else if (est === "en curso") {
                    texto = "En curso";
                  } else {
                    texto = "Pendiente de cerrar";
                  }

                  return (
                    <tr key={m} className="border-t border-d-sup-3/50">
                      <td className={`${td} font-semibold capitalize`}>{nombreMes(m)}</td>
                      <td className={td}>{r.dias}</td>
                      <td className={`${td} font-bold`}>{r.total}</td>
                      <td className={`${td} font-bold`}>{sellado ?? "—"}</td>
                      <td className={`px-2 py-1.5 text-[13px] ${color}`}>
                        {texto}
                        {dif != null && dif !== 0 && (
                          <span className="block text-red-400">
                            Hoy hay {dif > 0 ? `+${dif}` : dif} prendas frente al sello.
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {conTraza.length > 0 && (
          <>
            <h3 className="mb-2 mt-5 text-sm font-semibold text-d-txt">
              Qué ha pasado con los cierres
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Mes</th>
                    <th className={th}>Qué pasó</th>
                    <th className={th}>Total</th>
                    <th className={th}>Cuándo</th>
                    <th className={th}>Quién</th>
                  </tr>
                </thead>
                <tbody>
                  {conTraza.flatMap((m) =>
                    [...meses[m].datos.traza].reverse().map((t, i) => (
                      <tr key={`${m}-${i}`} className="border-t border-d-sup-3/50">
                        <td className={`${td} capitalize`}>{nombreMes(m)}</td>
                        <td className={td}>{t.que}</td>
                        <td className={`${td} font-bold`}>{t.total ?? "—"}</td>
                        <td className={`${td} text-[13px] text-d-txt-2`}>{t.cuando ?? "—"}</td>
                        <td className={`${td} text-[13px] text-d-txt-2`}>{t.quien ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
