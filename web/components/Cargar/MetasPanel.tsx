"use client";

import { useState } from "react";
import {
  metaEn,
  metasOrden,
  validarMeta,
  hoyTexto,
  bonita,
  claveFecha,
  META_TOTAL_POR_DEFECTO,
  META_PROPIAS_POR_DEFECTO,
} from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarGuardarMeta, ejecutarQuitarMeta } from "@/lib/data/escribir-metas";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";
import type { Meta } from "@/types/database";

/**
 * Panel "Metas del equipo" (Fase 4c). Puerto de pintarMetas()/metaGuardarClic()
 * (quin-admin.html:1356-1450). El historial es versionado: cada cambio es una
 * fila nueva y nada se borra (regla 6); solo se puede quitar una meta que aún no
 * entró en vigencia. Guardar y quitar pasan por VISTA PREVIA (dry-run) igual que
 * el resto de las escrituras.
 */
type Pendiente = { tipo: "guardar"; meta: Meta } | { tipo: "quitar"; meta: Meta };

const inputCls =
  "w-[110px] rounded-lg border border-d-sup-3 bg-d-sup-2 px-2.5 py-1.5 text-sm text-d-txt outline-none focus:outline-2 focus:outline-turquesa";
const th = "px-2 py-1.5 text-left text-[12px] font-semibold uppercase tracking-wide text-d-txt-2";
const td = "px-2 py-1.5 text-d-txt";

function describirCambio(orden: Meta[], i: number): string {
  const x = orden[i];
  const prev = i > 0 ? orden[i - 1] : null;
  if (!prev) return `meta inicial (antes ${META_TOTAL_POR_DEFECTO} / ${META_PROPIAS_POR_DEFECTO})`;
  if (prev.total === x.total && prev.propias === x.propias) return "sin cambio";
  const partes: string[] = [];
  if (prev.total !== x.total) partes.push(`total ${prev.total} → ${x.total}`);
  if (prev.propias !== x.propias) partes.push(`propias ${prev.propias} → ${x.propias}`);
  return partes.join(" · ");
}

export function MetasPanel() {
  const { metas, modoEscritura, aplicarGuardarMetaLocal, aplicarQuitarMetaLocal } = useCargar();
  const hoyK = (() => {
    const f = new Date();
    return claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate());
  })();
  const vigente = metaEn(hoyK, metas);

  const [total, setTotal] = useState(String(vigente.total));
  const [propias, setPropias] = useState(String(vigente.propias));
  const [desde, setDesde] = useState(hoyK);
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  // Cuando cambia la meta vigente (hidratación de la nube, o tras guardar), los
  // campos numéricos se resincronizan con ella como punto de partida a editar.
  // Ajuste en render (patrón recomendado por React), no en un efecto.
  const [baseVig, setBaseVig] = useState({ total: vigente.total, propias: vigente.propias });
  if (baseVig.total !== vigente.total || baseVig.propias !== vigente.propias) {
    setBaseVig({ total: vigente.total, propias: vigente.propias });
    setTotal(String(vigente.total));
    setPropias(String(vigente.propias));
  }

  const modoVivo = modoEscritura === "vivo";
  const orden = metasOrden(metas);
  const ultimaPorFecha: Record<string, number> = {};
  orden.forEach((x) => (ultimaPorFecha[x.desde] = x.id));

  function prepararGuardar() {
    setMensaje(null);
    const t = parseInt(total, 10);
    const p = parseInt(propias, 10);
    const error = validarMeta(metas, t, p, desde);
    if (error) {
      setMensaje({ ok: false, texto: error });
      return;
    }
    const meta: Meta = {
      id: Date.now(),
      desde,
      total: t,
      propias: p,
      cuando: hoyTexto(),
      quien: "Administrador",
      actualizado: "",
    };
    setPendiente({ tipo: "guardar", meta });
  }
  function prepararQuitar(meta: Meta) {
    setMensaje(null);
    setPendiente({ tipo: "quitar", meta });
  }

  async function confirmar() {
    if (!pendiente) return;
    setEscribiendo(true);
    if (pendiente.tipo === "guardar") {
      const { res, fila } = await ejecutarGuardarMeta(pendiente.meta);
      setEscribiendo(false);
      if (!res.ok || !fila) {
        setMensaje({ ok: false, texto: `No se pudo escribir: ${res.error}` });
        return;
      }
      aplicarGuardarMetaLocal(fila);
      setMensaje({ ok: true, texto: `Meta guardada. Aplica desde ${bonita(fila.desde)}.` });
    } else {
      const res = await ejecutarQuitarMeta(pendiente.meta.id);
      setEscribiendo(false);
      if (!res.ok) {
        setMensaje({ ok: false, texto: `No se pudo escribir: ${res.error}` });
        return;
      }
      aplicarQuitarMetaLocal(pendiente.meta.id);
      setMensaje({ ok: true, texto: `Quité la meta programada del ${bonita(pendiente.meta.desde)}.` });
    }
    setPendiente(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Metas del equipo</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <div className="mb-4 grid grid-cols-2 gap-3.5 sm:max-w-md">
          <div className="rounded-card-sm border border-turquesa/30 bg-turquesa/10 p-3.5">
            <p className="text-xs font-semibold text-d-txt-2">Meta total (Effi + Dropi)</p>
            <p className="text-2xl font-black text-d-txt">{vigente.total}</p>
            <p className="text-[12px] text-d-txt-2">
              {vigente.desde ? `vigente desde ${bonita(vigente.desde)}` : "valor de arranque"}
            </p>
          </div>
          <div className="rounded-card-sm border border-d-sup-3 bg-d-sup-2 p-3.5">
            <p className="text-xs font-semibold text-d-txt-2">Meta propias (Effi)</p>
            <p className="text-2xl font-black text-d-txt">{vigente.propias}</p>
            <p className="text-[12px] text-d-txt-2">
              {vigente.desde ? `vigente desde ${bonita(vigente.desde)}` : "valor de arranque"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[13px] font-semibold text-d-txt-2">
            Total
            <input
              type="number"
              min={0}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className={`mt-1 block ${inputCls}`}
            />
          </label>
          <label className="text-[13px] font-semibold text-d-txt-2">
            Propias
            <input
              type="number"
              min={0}
              value={propias}
              onChange={(e) => setPropias(e.target.value)}
              className={`mt-1 block ${inputCls}`}
            />
          </label>
          <label className="text-[13px] font-semibold text-d-txt-2">
            Aplica desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={`mt-1 block ${inputCls} w-[150px]`}
            />
          </label>
          <button
            onClick={prepararGuardar}
            className="rounded-full bg-turquesa px-4 py-2 text-[13px] font-bold text-d-en-turquesa hover:brightness-110"
          >
            Guardar meta
          </button>
          <ModoEscrituraToggle />
        </div>
        <p className="mt-2.5 text-[13px] text-d-txt-2">
          Los días <b className="text-d-txt">anteriores</b> a esa fecha conservan su meta. El cambio
          aplica de ahí en adelante y queda registrado abajo. Nada del historial se borra.
        </p>

        {pendiente && (
          <div className="mt-4 rounded-card-sm border border-turquesa/30 bg-turquesa/[0.07] p-4 text-sm">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
              {modoVivo ? "Confirmar escritura" : "Vista previa — no se escribe nada"}
            </p>
            {pendiente.tipo === "guardar" ? (
              <p className="text-d-txt">
                Upsert en <code className="text-turquesa">metas</code>: desde{" "}
                <b>{bonita(pendiente.meta.desde)}</b> → total {pendiente.meta.total}, propias{" "}
                {pendiente.meta.propias}
              </p>
            ) : (
              <p className="text-d-txt">
                Delete en <code className="text-turquesa">metas</code>: meta programada del{" "}
                <b>{bonita(pendiente.meta.desde)}</b> (total {pendiente.meta.total}, propias{" "}
                {pendiente.meta.propias})
              </p>
            )}
            <div className="mt-3 flex gap-2">
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

        {orden.length > 0 ? (
          <>
            <h3 className="mb-2 mt-5 text-sm font-semibold text-d-txt">Historial de metas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Desde</th>
                    <th className={th}>Total</th>
                    <th className={th}>Propias</th>
                    <th className={th}>Cambio</th>
                    <th className={th}>Registrado</th>
                    <th className={th}>Quién</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {orden
                    .map((x, i) => ({ x, i }))
                    .reverse()
                    .map(({ x, i }) => {
                      const reemplazada = ultimaPorFecha[x.desde] !== x.id;
                      const futura = x.desde > hoyK;
                      const esVigente = !reemplazada && !futura && x.desde === vigente.desde;
                      return (
                        <tr
                          key={x.id}
                          className={`border-t border-d-sup-3/50 ${reemplazada ? "opacity-50" : ""} ${
                            esVigente ? "bg-turquesa/10" : ""
                          }`}
                        >
                          <td className={td}>
                            {bonita(x.desde)}
                            {esVigente && <b className="ml-1 text-emerald-400">· vigente</b>}
                            {futura && <b className="ml-1 text-amber-400">· programada</b>}
                            {reemplazada && <span className="ml-1 text-d-txt-2">· reemplazada</span>}
                          </td>
                          <td className={`${td} font-bold`}>{x.total}</td>
                          <td className={`${td} font-bold`}>{x.propias}</td>
                          <td className={`${td} text-[13px] text-d-txt-2`}>{describirCambio(orden, i)}</td>
                          <td className={`${td} text-[13px] text-d-txt-2`}>{x.cuando ?? "—"}</td>
                          <td className={`${td} text-[13px] text-d-txt-2`}>{x.quien ?? "Administrador"}</td>
                          <td className="px-2 py-1.5">
                            {futura && (
                              <button
                                onClick={() => prepararQuitar(x)}
                                className="rounded-full border border-d-sup-3 px-3 py-1 text-[12px] font-semibold text-d-txt-2 hover:bg-d-sup-2"
                              >
                                Quitar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-4 text-[13px] text-d-txt-2">
            Todavía no cambiaste ninguna meta. Se usan los valores de arranque:{" "}
            <b className="text-d-txt">{META_TOTAL_POR_DEFECTO}</b> total y{" "}
            <b className="text-d-txt">{META_PROPIAS_POR_DEFECTO}</b> propias.
          </p>
        )}
      </div>
    </section>
  );
}
