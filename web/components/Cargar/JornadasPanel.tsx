"use client";

import { useState } from "react";
import {
  claveFecha,
  bonita,
  hoyTexto,
  MESES_L,
  planificarCierre,
  planificarReapertura,
  type ResultadoCalculo,
  type PlanCierre,
  type PlanReapertura,
} from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarCierre, ejecutarReapertura } from "@/lib/data/escribir-jornadas";
import { prepararBosquejo, ejecutarBosquejo, type PlanBosquejo } from "@/lib/data/escribir-bosquejo";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";
import type { Jornada } from "@/types/database";

/**
 * Panel "Jornadas" (Fases 4b-1 lectura + 4b-2 escritura). Puerto de
 * renderCongelado() (quin-admin.html:1452-1631). Muestra, mes por mes, un
 * calendario con el estado de cada día y permite CERRAR los días sin cerrar y
 * REABRIR los cerrados.
 *
 * Toda escritura pasa primero por una VISTA PREVIA (dry-run, el modo por
 * defecto): se ve exactamente qué filas se escribirían antes de tocar nada. Solo
 * en modo "En vivo" y tras un segundo paso deliberado se escribe a producción,
 * con mutaciones puntuales (upsert del día / delete del día + reemplazo del
 * ranking del mes), nunca borrados masivos.
 */

const DOW = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

type Pendiente =
  | { tipo: "cierre"; plan: PlanCierre }
  | { tipo: "reapertura"; plan: PlanReapertura }
  | { tipo: "bosquejo"; plan: PlanBosquejo };

function DetalleJornada({ j, onReabrir }: { j: Jornada; onReabrir: (fecha: string) => void }) {
  const oficial = j.propias + j.dropi;
  const ultima = j.fotos.length ? j.fotos[j.fotos.length - 1] : null;
  const revisado = ultima ? ultima.p + ultima.d : null;
  const dif = revisado == null ? null : revisado - oficial;
  const colorDif =
    dif == null ? "text-d-txt-2" : dif < 0 ? "text-red-400" : dif > 0 ? "text-emerald-400" : "text-d-txt-2";

  return (
    <div className="mt-2.5 rounded-card-sm bg-turquesa/10 p-4 text-sm">
      <p className="mb-2 font-semibold text-d-txt">{bonita(j.fecha)}</p>
      <table className="w-full text-[13px]">
        <tbody>
          <tr>
            <td className="py-1 text-d-txt-2">Oficial</td>
            <td className="py-1 text-right text-d-txt">
              <b>{oficial}</b> ({j.propias} propias · {j.dropi} Dropi)
            </td>
          </tr>
          <tr>
            <td className="py-1 text-d-txt-2">Última revisión</td>
            <td className="py-1 text-right text-d-txt">
              {revisado == null ? "—" : `${revisado} · ${ultima!.cuando}`}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-d-txt-2">Diferencia</td>
            <td className={`py-1 text-right ${colorDif}`}>
              {dif == null ? "—" : dif > 0 ? `+${dif}` : dif}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-d-txt-2">Cerrada el</td>
            <td className="py-1 text-right text-d-txt">{j.cerrada_el || j.fecha}</td>
          </tr>
        </tbody>
      </table>
      <button
        onClick={() => onReabrir(j.fecha)}
        className="mt-3 rounded-full border border-red-500/40 px-3 py-1.5 text-[13px] font-semibold text-red-400 hover:bg-red-500/10"
      >
        Reabrir esta jornada
      </button>
    </div>
  );
}

function CalendarioMes({
  mes,
  jornadas,
  dias,
  abierta,
  seleccion,
  onTocarCerrada,
  onToggleSel,
}: {
  mes: string;
  jornadas: Record<string, Jornada>;
  dias: ResultadoCalculo["dias"];
  abierta: string | null;
  seleccion: Set<string>;
  onTocarCerrada: (k: string) => void;
  onToggleSel: (k: string) => void;
}) {
  const [ano, mes1] = mes.split("-").map(Number);
  const hueco = (new Date(ano, mes1 - 1, 1).getDay() + 6) % 7;
  const ultimo = new Date(ano, mes1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < hueco; i++) celdas.push(<div key={`h${i}`} />);
  for (let d = 1; d <= ultimo; d++) {
    const k = claveFecha(ano, mes1, d);
    const j = jornadas[k];
    const c = dias[k];
    let clase = "border border-d-sup-3 bg-d-sup-3/40 text-d-txt-2";
    let val = "·";
    let tip = "";
    let onClick: (() => void) | undefined;
    let extra = "";
    if (j) {
      const revisada = j.fotos.length > 0;
      clase = revisada
        ? "border border-amber-500/50 bg-amber-500/15 text-d-txt cursor-pointer"
        : "border border-turquesa/30 bg-turquesa/10 text-d-txt cursor-pointer";
      val = String(j.propias + j.dropi);
      tip = revisada ? "cerrada, con revisión" : "cerrada";
      onClick = () => onTocarCerrada(k);
      if (abierta === k) extra = " outline outline-2 outline-turquesa";
    } else if (c) {
      const sel = seleccion.has(k);
      clase = sel
        ? "border border-turquesa bg-turquesa/25 text-d-txt cursor-pointer"
        : "border border-d-sup-3 bg-d-sup-2 text-d-txt cursor-pointer";
      val = String(c.propias + c.dropi);
      tip = "cargada, sin cerrar";
      onClick = () => onToggleSel(k);
    }
    celdas.push(
      <div
        key={k}
        title={tip}
        onClick={onClick}
        className={`flex min-h-[46px] flex-col rounded-md p-1 ${clase}${extra}`}
      >
        <span className="text-[11px] leading-none text-d-txt-2">{d}</span>
        <span className="mt-auto text-right text-[13px] font-semibold tabular-nums">{val}</span>
      </div>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-7 gap-1">
      {DOW.map((d) => (
        <div key={d} className="pb-1 text-center text-[11px] font-semibold text-d-txt-2">
          {d}
        </div>
      ))}
      {celdas}
    </div>
  );
}

function VistaPrevia({
  pendiente,
  modoVivo,
  escribiendo,
  onConfirmar,
  onCancelar,
}: {
  pendiente: Pendiente;
  modoVivo: boolean;
  escribiendo: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="mt-4 rounded-card-sm border border-turquesa/30 bg-turquesa/[0.07] p-4 text-sm">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
        {modoVivo ? "Confirmar escritura" : "Vista previa — no se escribe nada"}
      </p>

      {pendiente.tipo === "cierre" ? (
        <div className="text-d-txt">
          <p className="mb-2">{pendiente.plan.resumen}</p>
          <p className="mb-1 font-semibold">
            Upsert en <code className="text-turquesa">jornadas</code> ({pendiente.plan.jornadas.length}):
          </p>
          <ul className="mb-2 space-y-0.5 text-[13px] text-d-txt-2">
            {pendiente.plan.jornadas.map((f) => (
              <li key={f.fecha}>
                {bonita(f.fecha)} → {f.propias} propias · {f.dropi} Dropi ·{" "}
                {f.fotos.length ? `+1 foto (${f.fotos.length} total)` : `cerrada el ${f.cerrada_el}`}
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-d-txt-2">
            Reemplazar <code className="text-turquesa">ranking_publico</code> de:{" "}
            {pendiente.plan.ranking.map((r) => `${r.mes} (${r.filas.length})`).join(", ") || "—"}
          </p>
        </div>
      ) : pendiente.tipo === "reapertura" ? (
        <div className="text-d-txt">
          <p className="mb-2">
            Reabrir <b>{bonita(pendiente.plan.fecha)}</b>: se borra esa jornada oficial y deja de ser
            cifra oficial.
          </p>
          <p className="mb-1 text-[13px] text-d-txt-2">
            Delete en <code className="text-turquesa">jornadas</code> donde fecha ={" "}
            {pendiente.plan.fecha} y cerrada = true.
          </p>
          <p className="text-[13px] text-d-txt-2">
            Reemplazar <code className="text-turquesa">ranking_publico</code> de:{" "}
            {pendiente.plan.ranking.map((r) => `${r.mes} (${r.filas.length})`).join(", ")}
          </p>
        </div>
      ) : (
        <div className="text-d-txt">
          <p className="mb-2">
            Publicar los días <b>sin cerrar</b> para que el equipo los vea en la vista pública.
          </p>
          <p className="mb-1 text-[13px] text-d-txt-2">
            Upsert de <b>{pendiente.plan.upserts.length}</b> día(s) sin cerrar en{" "}
            <code className="text-turquesa">jornadas</code> (cerrada:false).
          </p>
          <p className="mb-1 text-[13px] text-d-txt-2">
            Borrar <b>{pendiente.plan.borrar.length}</b> borrador(es) viejos (solo cerrada:false,
            nunca oficiales).
          </p>
          <p className="text-[13px] text-d-txt-2">
            Reemplazar <code className="text-turquesa">ranking_publico</code> de:{" "}
            {pendiente.plan.ranking.map((r) => `${r.mes} (${r.filas.length})`).join(", ")}
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {modoVivo && (
          <button
            onClick={onConfirmar}
            disabled={escribiendo}
            className="rounded-full bg-red-500 px-4 py-2 text-[13px] font-bold text-white hover:brightness-110 disabled:opacity-60"
          >
            {escribiendo ? "Escribiendo…" : "Escribir en producción"}
          </button>
        )}
        <button
          onClick={onCancelar}
          disabled={escribiendo}
          className="rounded-full border border-d-sup-3 px-4 py-2 text-[13px] font-semibold text-d-txt-2 hover:bg-d-sup-2 disabled:opacity-60"
        >
          {modoVivo ? "Cancelar" : "Cerrar vista previa"}
        </button>
      </div>
    </div>
  );
}

/** El de mayor cantidad en un mapa nombre→cantidad, o null si está vacío. */
function top(mapa: Record<string, number>): { nombre: string; n: number } | null {
  let mejor: { nombre: string; n: number } | null = null;
  for (const [nombre, n] of Object.entries(mapa)) {
    if (!mejor || n > mejor.n) mejor = { nombre, n };
  }
  return mejor;
}

/**
 * Resumen de ventas del mes que se muestra al lado del calendario: total de
 * prendas, mejor vendedor de Effi (propias) y mejor tienda de Dropi. Reemplaza
 * la ilustración de Quino que iba ahí. Los "mejores" salen del detalle por día
 * del Excel cargado (dias[k].ven / .tie); si ese mes no tiene Excel cargado,
 * quedan en "sin datos" (el total sí sale del oficial de la nube).
 */
function ResumenVentas({
  total,
  mejorVend,
  mejorTienda,
}: {
  total: number;
  mejorVend: { nombre: string; n: number } | null;
  mejorTienda: { nombre: string; n: number } | null;
}) {
  return (
    <aside className="w-full max-w-[300px] shrink-0 self-center rounded-card border border-d-sup-3 bg-turquesa/[0.06] p-5">
      <p className="eyebrow">Resumen de ventas</p>
      <p className="mt-3 text-[13px] text-d-txt-2">Total de ventas</p>
      <p className="text-[40px] font-black leading-none text-d-txt">
        {total}
        <span className="ml-1.5 text-base font-semibold text-d-txt-2">prendas</span>
      </p>
      <div className="mt-4 grid gap-2.5">
        <div className="rounded-card-sm border border-d-sup-3 bg-d-sup p-3">
          <p className="eyebrow text-[0.62rem]">Mejor vendedor · Effi</p>
          <p className="mt-1 truncate font-black text-d-txt">{mejorVend ? mejorVend.nombre : "—"}</p>
          <p className="text-[13px] text-d-txt-2">
            {mejorVend ? `${mejorVend.n} propias` : "sin datos del Excel"}
          </p>
        </div>
        <div className="rounded-card-sm border border-d-sup-3 bg-d-sup p-3">
          <p className="eyebrow text-[0.62rem]">Mejor tienda · Dropi</p>
          <p className="mt-1 truncate font-black text-d-txt">
            {mejorTienda ? mejorTienda.nombre : "—"}
          </p>
          <p className="text-[13px] text-d-txt-2">
            {mejorTienda ? `${mejorTienda.n} Dropi` : "sin datos del Excel"}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function JornadasPanel({ resultado }: { resultado: ResultadoCalculo }) {
  const { jornadas, modoEscritura, aplicarCierreLocal, aplicarReaperturaLocal } = useCargar();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const { dias, claves } = resultado;

  const mesesSet = new Set<string>();
  claves.forEach((k) => mesesSet.add(k.slice(0, 7)));
  Object.keys(jornadas).forEach((k) => mesesSet.add(k.slice(0, 7)));
  const listaM = [...mesesSet].sort().reverse();

  if (!listaM.length) return null;

  const pendTot = claves.filter((k) => !jornadas[k]).length;
  const histTot = Object.keys(jornadas).length;
  const modoVivo = modoEscritura === "vivo";

  function toggleDetalle(k: string) {
    setAbierta((prev) => (prev === k ? null : k));
  }
  function toggleSel(k: string) {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (s.has(k)) s.delete(k);
      else s.add(k);
      return s;
    });
  }
  function marcarMes(m: string) {
    setSeleccion((prev) => {
      const s = new Set(prev);
      claves.forEach((k) => {
        if (k.slice(0, 7) === m && !jornadas[k]) s.add(k);
      });
      return s;
    });
  }
  function limpiarMes(m: string) {
    setSeleccion((prev) => {
      const s = new Set(prev);
      [...s].forEach((k) => {
        if (k.slice(0, 7) === m) s.delete(k);
      });
      return s;
    });
  }

  function prepararCierre() {
    setMensaje(null);
    const plan = planificarCierre(
      [...seleccion],
      dias,
      jornadas,
      hoyTexto(),
      new Date().toISOString()
    );
    if (!plan.jornadas.length) return;
    setPendiente({ tipo: "cierre", plan });
  }
  function prepararReapertura(fecha: string) {
    setMensaje(null);
    setPendiente({ tipo: "reapertura", plan: planificarReapertura(fecha, jornadas, dias) });
  }
  async function prepararBosquejoAccion() {
    setMensaje(null);
    setPreparando(true);
    const f = new Date();
    const mesActual = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
    const { plan, error } = await prepararBosquejo(dias, jornadas, mesActual);
    setPreparando(false);
    if (error || !plan) {
      setMensaje({ ok: false, texto: `No se pudo preparar el bosquejo: ${error}` });
      return;
    }
    setPendiente({ tipo: "bosquejo", plan });
  }

  async function confirmar() {
    if (!pendiente) return;
    setEscribiendo(true);
    const res =
      pendiente.tipo === "cierre"
        ? await ejecutarCierre(pendiente.plan)
        : pendiente.tipo === "reapertura"
          ? await ejecutarReapertura(pendiente.plan)
          : await ejecutarBosquejo(pendiente.plan);
    setEscribiendo(false);
    if (!res.ok) {
      setMensaje({ ok: false, texto: `No se pudo escribir: ${res.error}` });
      return;
    }
    if (pendiente.tipo === "cierre") {
      aplicarCierreLocal(pendiente.plan.jornadas);
      setSeleccion(new Set());
      setMensaje({ ok: true, texto: pendiente.plan.resumen });
    } else if (pendiente.tipo === "reapertura") {
      aplicarReaperturaLocal(pendiente.plan.fecha);
      setAbierta(null);
      setMensaje({ ok: true, texto: `Reabrí la jornada ${bonita(pendiente.plan.fecha)}.` });
    } else {
      setMensaje({
        ok: true,
        texto: `Publiqué ${pendiente.plan.upserts.length} día(s) sin cerrar en la vista pública.`,
      });
    }
    setPendiente(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Jornadas</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-d-txt-2">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border border-turquesa/30 bg-turquesa/10" />
            Cerrada (oficial)
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border border-d-sup-3 bg-d-sup-2" />
            Cargada sin cerrar
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border border-amber-500/50 bg-amber-500/15" />
            Con revisión
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border border-d-sup-3 bg-d-sup-3/40" />
            Sin datos
          </span>
        </div>
        <p className="mb-3 text-[13px] text-d-txt-2">
          {claves.length > 0 && (
            <>
              <b className="text-d-txt">{claves.length}</b> día{claves.length === 1 ? "" : "s"} en el
              archivo · <b className="text-amber-400">{pendTot}</b> sin cerrar ·{" "}
            </>
          )}
          <b className="text-d-txt">{histTot}</b> en el historial ·{" "}
          <b className="text-d-txt">{listaM.length}</b> mes{listaM.length === 1 ? "" : "es"}
        </p>

        {listaM.map((m, idx) => {
          const [ano, mes1] = m.split("-").map(Number);
          const ultimo = new Date(ano, mes1, 0).getDate();
          let ksMes = 0;
          let suma = 0;
          let pend = 0;
          let rev = 0;
          const venMes: Record<string, number> = {};
          const tieMes: Record<string, number> = {};
          for (let d = 1; d <= ultimo; d++) {
            const k = claveFecha(ano, mes1, d);
            const j = jornadas[k];
            const c = dias[k];
            if (!j && !c) continue;
            ksMes++;
            suma += j ? j.propias + j.dropi : c.propias + c.dropi;
            if (!j) pend++;
            if (j && j.fotos.length) rev++;
            // El "mejor vendedor / tienda" sale del detalle por día del Excel
            // cargado (los oficiales de la nube no guardan ese desglose).
            if (c) {
              for (const [v, nn] of Object.entries(c.ven)) venMes[v] = (venMes[v] || 0) + nn;
              for (const [t, nn] of Object.entries(c.tie)) tieMes[t] = (tieMes[t] || 0) + nn;
            }
          }
          const mejorVend = top(venMes);
          const mejorTienda = top(tieMes);
          return (
            <details key={m} open={idx === 0} className="border-t border-d-sup-3 py-2">
              <summary className="cursor-pointer text-sm text-d-txt">
                <span className="font-semibold capitalize">
                  {MESES_L[mes1 - 1]} {ano}
                </span>
                <span className="text-d-txt-2">
                  {" · "}
                  {ksMes} día{ksMes === 1 ? "" : "s"} · {suma} prendas ·{" "}
                  {pend ? <b className="text-amber-400">{pend} sin cerrar</b> : "todas cerradas"}
                  {rev ? ` · ${rev} con revisión` : ""}
                </span>
              </summary>

              {pend > 0 && (
                <p className="mt-2 flex gap-3 text-[12px]">
                  <button
                    onClick={() => marcarMes(m)}
                    className="font-semibold text-turquesa hover:underline"
                  >
                    marcar las {pend} sin cerrar
                  </button>
                  <button
                    onClick={() => limpiarMes(m)}
                    className="font-semibold text-d-txt-2 hover:underline"
                  >
                    quitar marcas
                  </button>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-8">
                <div className="w-full max-w-[560px]">
                  <CalendarioMes
                    mes={m}
                    jornadas={jornadas}
                    dias={dias}
                    abierta={abierta}
                    seleccion={seleccion}
                    onTocarCerrada={toggleDetalle}
                    onToggleSel={toggleSel}
                  />
                </div>
                <ResumenVentas total={suma} mejorVend={mejorVend} mejorTienda={mejorTienda} />
              </div>
              {abierta && abierta.slice(0, 7) === m && jornadas[abierta] && (
                <DetalleJornada j={jornadas[abierta]} onReabrir={prepararReapertura} />
              )}
            </details>
          );
        })}

        {/* ---- barra de escritura ---- */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-d-sup-3 pt-4">
          <ModoEscrituraToggle />
          <button
            onClick={prepararCierre}
            disabled={seleccion.size === 0}
            className="rounded-full bg-turquesa px-4 py-2 text-[13px] font-bold text-d-en-turquesa hover:brightness-110 disabled:cursor-default disabled:opacity-50"
          >
            Cerrar seleccionadas{seleccion.size ? ` (${seleccion.size})` : ""}
          </button>
          {pendTot > 0 && (
            <button
              onClick={prepararBosquejoAccion}
              disabled={preparando}
              className="rounded-full border border-turquesa/40 px-4 py-2 text-[13px] font-semibold text-turquesa hover:bg-turquesa/10 disabled:opacity-50"
            >
              {preparando ? "Preparando…" : `Publicar días sin cerrar (${pendTot})`}
            </button>
          )}
          <span className="text-[12px] text-d-txt-2">
            {modoVivo
              ? "Modo en vivo: la confirmación escribe en producción."
              : "Vista previa: revisás antes de escribir; nada toca la nube."}
          </span>
        </div>

        {pendiente && (
          <VistaPrevia
            pendiente={pendiente}
            modoVivo={modoVivo}
            escribiendo={escribiendo}
            onConfirmar={confirmar}
            onCancelar={() => setPendiente(null)}
          />
        )}

        {mensaje && (
          <p
            className={`mt-3 text-sm ${mensaje.ok ? "text-emerald-400" : "text-red-400"}`}
          >
            {mensaje.ok ? "Listo: " : ""}
            {mensaje.texto}
          </p>
        )}

        {histTot > 0 && (
          <p className="mt-3 text-[12px] text-d-txt-2">
            Toca un día <b className="text-d-txt">cerrado</b> para ver su detalle y reabrirlo. Toca un
            día <b className="text-d-txt">sin cerrar</b> para marcarlo.
          </p>
        )}
      </div>
    </section>
  );
}
