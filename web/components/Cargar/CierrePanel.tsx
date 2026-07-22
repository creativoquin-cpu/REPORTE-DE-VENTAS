"use client";

import { useState } from "react";
import {
  estadoMes,
  resumenMensualCerrado,
  resumenMes,
  sellarMes,
  reabrirMesDatos,
  hoyTexto,
  MESES_L,
} from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarSelloMes } from "@/lib/data/escribir-meses";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";
import type { MesCerradoDatos } from "@/types/database";

/**
 * Panel "Cierre mensual" (Fases 4b-1 lectura + 4b-3 escritura). Puerto de
 * pintarCierre() (quin-admin.html:1249-1342). Muestra cada mes con su estado y
 * permite SELLAR (cerrar a mano) o REABRIR un mes.
 *
 * Igual que las jornadas: toda escritura pasa por VISTA PREVIA (dry-run) y solo
 * en modo "En vivo" y tras confirmar se escribe la fila de `meses` en producción
 * (mutación puntual de un mes). El sellado automático del app viejo NO se porta:
 * acá el admin sella a mano, para no escribir en silencio al abrir la página.
 */
function nombreMes(m: string): string {
  const [ano, mes1] = m.split("-").map(Number);
  return `${MESES_L[mes1 - 1]} ${ano}`;
}

const th = "px-2 py-1.5 text-left text-[12px] font-semibold uppercase tracking-wide text-d-txt-2";
const td = "px-2 py-1.5 text-d-txt";

type Pendiente = { mes: string; accion: "sellar" | "reabrir"; datos: MesCerradoDatos };

export function CierrePanel() {
  const { jornadas, meses, metas, modoEscritura, aplicarSelloLocal } = useCargar();
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const modoVivo = modoEscritura === "vivo";

  const mesActual = (() => {
    const f = new Date();
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
  })();

  const set = new Set<string>();
  Object.keys(jornadas).forEach((k) => set.add(k.slice(0, 7)));
  Object.keys(meses).forEach((m) => set.add(m));
  const listaM = [...set].sort().reverse();

  const conTraza = listaM.filter((m) => (meses[m]?.datos.traza ?? []).length > 0);

  function prepararSellar(m: string) {
    setMensaje(null);
    const resumen = resumenMes(jornadas, metas, m);
    if (!resumen.dias) {
      setMensaje({ ok: false, texto: "Ese mes no tiene jornadas cerradas todavía." });
      return;
    }
    setPendiente({ mes: m, accion: "sellar", datos: sellarMes(meses[m]?.datos ?? null, resumen, hoyTexto()) });
  }
  function prepararReabrir(m: string) {
    setMensaje(null);
    const previo = meses[m]?.datos;
    if (!previo) return;
    setPendiente({ mes: m, accion: "reabrir", datos: reabrirMesDatos(previo, hoyTexto()) });
  }

  async function confirmar() {
    if (!pendiente) return;
    setEscribiendo(true);
    const { res, fila } = await ejecutarSelloMes(pendiente.mes, pendiente.datos);
    setEscribiendo(false);
    if (!res.ok || !fila) {
      setMensaje({ ok: false, texto: `No se pudo escribir: ${res.error}` });
      return;
    }
    aplicarSelloLocal(fila);
    setMensaje({
      ok: true,
      texto:
        pendiente.accion === "sellar"
          ? `Sellé ${nombreMes(pendiente.mes)}.`
          : `Reabrí ${nombreMes(pendiente.mes)}.`,
    });
    setPendiente(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Cierre mensual</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-3 text-[13px] text-d-txt-2">
          Al <b className="text-d-txt">sellar</b> un mes su resumen queda fijo y ya no cambia aunque
          entren reportes tarde. Si necesitás incluirlos, <b className="text-d-txt">reabrí</b> el mes
          y volvé a sellarlo.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <ModoEscrituraToggle />
          <span className="text-[12px] text-d-txt-2">
            {modoVivo
              ? "Modo en vivo: la confirmación escribe en producción."
              : "Vista previa: revisás antes de escribir; nada toca la nube."}
          </span>
        </div>

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
                  <th className={th}></th>
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
                    texto = "Reabierto — sellalo de nuevo";
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
                      <td className="px-2 py-1.5">
                        {est === "cerrado" ? (
                          <button
                            onClick={() => prepararReabrir(m)}
                            className="rounded-full border border-d-sup-3 px-3 py-1 text-[12px] font-semibold text-d-txt-2 hover:bg-d-sup-2"
                          >
                            Reabrir
                          </button>
                        ) : (
                          <button
                            onClick={() => prepararSellar(m)}
                            className="rounded-full bg-turquesa px-3 py-1 text-[12px] font-bold text-d-en-turquesa hover:brightness-110"
                          >
                            Cerrar ahora
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pendiente && (
          <div className="mt-4 rounded-card-sm border border-turquesa/30 bg-turquesa/[0.07] p-4 text-sm">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
              {modoVivo ? "Confirmar escritura" : "Vista previa — no se escribe nada"}
            </p>
            <p className="mb-1 text-d-txt">
              Upsert en <code className="text-turquesa">meses</code> · <b>{nombreMes(pendiente.mes)}</b>
            </p>
            <ul className="mb-2 text-[13px] text-d-txt-2">
              <li>
                Estado → <b>{pendiente.datos.estado}</b>
              </li>
              {pendiente.accion === "sellar" && (
                <li>Total sellado → {pendiente.datos.resumen?.total ?? "—"}</li>
              )}
              <li>
                +traza: {pendiente.datos.traza[pendiente.datos.traza.length - 1]?.que}
              </li>
            </ul>
            <div className="flex gap-2">
              {modoVivo && (
                <button
                  onClick={confirmar}
                  disabled={escribiendo}
                  className="rounded-full bg-red-500 px-4 py-2 text-[13px] font-bold text-white hover:brightness-110 disabled:opacity-60"
                >
                  {escribiendo ? "Escribiendo…" : "Escribir en producción"}
                </button>
              )}
              <button
                onClick={() => setPendiente(null)}
                disabled={escribiendo}
                className="rounded-full border border-d-sup-3 px-4 py-2 text-[13px] font-semibold text-d-txt-2 hover:bg-d-sup-2 disabled:opacity-60"
              >
                {modoVivo ? "Cancelar" : "Cerrar vista previa"}
              </button>
            </div>
          </div>
        )}

        {mensaje && (
          <p className={`mt-3 text-sm ${mensaje.ok ? "text-emerald-400" : "text-red-400"}`}>
            {mensaje.ok ? "Listo: " : ""}
            {mensaje.texto}
          </p>
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
