"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  calcular,
  claveFecha,
  bonita,
  MESES_L,
  porQueNoLaborable,
  datoDia,
  correrMes,
  mesesConAlgo,
  mesInicial,
  marcarRango,
  resumenSeleccion,
} from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { useHidratarNube } from "@/lib/store/useHidratarNube";
import type { EstadoAdminInicial } from "@/lib/data/admin";

/**
 * Pestaña 3 · Calendario (Fase 6, solo lectura). Dos meses lado a lado con
 * selección por arrastre (o toque suelto para uno) y un resumen automático de
 * lo seleccionado. Puerto de la pestaña 3 (quin-admin.html:2660-2834). Reusa el
 * estado del store: jornadas de la nube + bosquejo del Excel de la sesión.
 */
const MESES_VIS = 2;
const DOW = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

type DragState = { desde: string; previo: Set<string>; movio: boolean };

function claveDeEvento(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  const celda = el?.closest("[data-k]");
  return celda?.getAttribute("data-k") ?? null;
}

export function CalendarioPanel({ estadoInicial }: { estadoInicial: EstadoAdminInicial }) {
  useHidratarNube(estadoInicial);
  const {
    jornadas,
    filasDropi,
    filasEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    diasManuales,
  } = useCargar();

  const calc = calcular({
    filasDropi,
    filasEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    diasManuales,
  });

  const [ancla, setAncla] = useState("");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const drag = useRef<DragState | null>(null);

  const f = new Date();
  const hoyMes = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
  const anclaActiva = ancla || mesInicial(jornadas, calc.dias, MESES_VIS, hoyMes);

  const ms = mesesConAlgo(jornadas, calc.dias);
  const nCerradas = Object.keys(jornadas).length;
  const nPend = calc.claves.filter((k) => !jornadas[k]).length;

  function irAMes(m: string) {
    setAncla(correrMes(m, -(MESES_VIS - 1)));
  }

  // ---- selección por arrastre ----
  function onPointerDown(e: ReactPointerEvent) {
    const k = claveDeEvento(e.clientX, e.clientY);
    if (!k) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { desde: k, previo: new Set(seleccion), movio: false };
  }
  function onPointerMove(e: ReactPointerEvent) {
    if (!drag.current) return;
    const k = claveDeEvento(e.clientX, e.clientY);
    if (!k) return;
    if (k !== drag.current.desde) drag.current.movio = true;
    setSeleccion(new Set(marcarRango(drag.current.desde, k)));
  }
  function onPointerUp(e: ReactPointerEvent) {
    const dg = drag.current;
    if (!dg) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (!dg.movio) {
      // toque suelto: agrega o quita ese día
      const s = new Set(dg.previo);
      if (s.has(dg.desde)) s.delete(dg.desde);
      else s.add(dg.desde);
      setSeleccion(s);
    }
    drag.current = null;
  }

  const R = resumenSeleccion([...seleccion], jornadas, calc.dias);
  const prom = (x: number) => (R.n ? Math.round((x * 10) / R.n) / 10 : 0);

  const rango = Array.from({ length: MESES_VIS }, (_, i) => {
    const m = correrMes(anclaActiva, i);
    const [y, mm] = m.split("-").map(Number);
    return `${MESES_L[mm - 1]} ${y}`;
  }).join("  ·  ");

  const btn =
    "rounded-full border border-d-sup-3 px-3 py-1.5 text-[13px] font-semibold text-d-txt-2 hover:bg-d-sup-2";

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
          Análisis por fechas
        </p>
        <h1 className="text-[26px] font-black tracking-tight text-d-txt">
          Explora la jornada por fechas
        </h1>
      </div>

      {nCerradas === 0 && nPend === 0 ? (
        <div className="rounded-card-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-d-txt">
          <b>Todavía no hay nada que mostrar.</b> Andá a <b>1 · Cargar y validar</b>, subí los Excel y
          cerrá jornadas. Luego volvé acá.
        </div>
      ) : (
        <div className="rounded-card-sm border border-d-sup-3 bg-d-sup-2 px-4 py-3 text-[13px] text-d-txt-2">
          <b className="text-d-txt">{nCerradas}</b> jornada{nCerradas === 1 ? "" : "s"} cerrada
          {nCerradas === 1 ? "" : "s"}
          {nPend > 0 && (
            <>
              {" · "}
              <b className="text-d-txt">{nPend}</b> día{nPend === 1 ? "" : "s"} sin cerrar (en gris)
            </>
          )}
          {ms.length > 0 && (
            <span className="ml-2 inline-flex flex-wrap gap-1.5">
              {[...ms].reverse().map((m) => {
                const [y, mm] = m.split("-").map(Number);
                return (
                  <button
                    key={m}
                    onClick={() => irAMes(m)}
                    className="rounded-md px-2 py-0.5 font-semibold text-turquesa hover:bg-d-sup-3"
                  >
                    {MESES_L[mm - 1]} {y}
                  </button>
                );
              })}
            </span>
          )}
        </div>
      )}

      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button className={btn} onClick={() => setAncla(correrMes(anclaActiva, -1))}>
            ‹
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-d-txt">{rango}</span>
          <button className={btn} onClick={() => setAncla(correrMes(anclaActiva, 1))}>
            ›
          </button>
          <button className={btn} onClick={() => setAncla(correrMes(hoyMes, -(MESES_VIS - 1)))}>
            Hoy
          </button>
          <button className={btn} onClick={() => setSeleccion(new Set())}>
            Limpiar selección
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 text-[12px] text-d-txt-2">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border border-d-sup-3 bg-d-sup-2" />
            Jornada cerrada
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm bg-amber-500/25" />
            Sin cerrar (no suma)
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm bg-d-sup-3/60" />
            No laborable
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm bg-turquesa" />
            Seleccionado
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div
            className="grid touch-none select-none gap-6 sm:grid-cols-2"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {Array.from({ length: MESES_VIS }, (_, i) => {
              const m = correrMes(anclaActiva, i);
              const [ano, mes1] = m.split("-").map(Number);
              const hueco = (new Date(ano, mes1 - 1, 1).getDay() + 6) % 7;
              const ultimo = new Date(ano, mes1, 0).getDate();
              const celdas = [];
              for (let h = 0; h < hueco; h++) celdas.push(<div key={`h${h}`} />);
              for (let d = 1; d <= ultimo; d++) {
                const k = claveFecha(ano, mes1, d);
                const dat = datoDia(k, jornadas, calc.dias);
                const nolab = porQueNoLaborable(k, diasManuales) != null;
                const sel = seleccion.has(k);
                let clase = "border border-d-sup-3 bg-d-sup-3/40 text-d-txt-2"; // vacía
                if (sel) clase = "border border-turquesa bg-turquesa/25 text-d-txt";
                else if (dat && !dat.cerrada) clase = "border border-amber-500/40 bg-amber-500/15 text-d-txt";
                else if (dat) clase = "border border-d-sup-3 bg-d-sup-2 text-d-txt";
                else if (nolab) clase = "border border-d-sup-3 bg-d-sup-3/70 text-d-txt-2";
                celdas.push(
                  <div
                    key={k}
                    data-k={k}
                    title={dat && !dat.cerrada ? "Cargado del Excel, sin cerrar. No suma." : ""}
                    className={`flex min-h-[44px] cursor-pointer flex-col rounded-md p-1 ${clase}`}
                  >
                    <span className="text-[11px] leading-none text-d-txt-2">{d}</span>
                    <span className="mt-auto text-right text-[13px] font-semibold tabular-nums">
                      {dat ? dat.t : "·"}
                    </span>
                  </div>
                );
              }
              return (
                <div key={m}>
                  <h3 className="mb-2 text-sm font-black capitalize text-d-txt">
                    {MESES_L[mes1 - 1]} {ano}
                  </h3>
                  <div className="grid grid-cols-7 gap-1">
                    {DOW.map((dd) => (
                      <div key={dd} className="pb-1 text-center text-[11px] font-semibold text-d-txt-2">
                        {dd}
                      </div>
                    ))}
                    {celdas}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="self-start rounded-card border border-d-sup-3 bg-d-sup-2 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
              Resultado automático
            </p>
            {seleccion.size === 0 ? (
              <p className="mt-2 text-sm text-d-txt-2">Toca un día para comenzar.</p>
            ) : (
              <>
                <p className="mt-1 text-xl font-black text-d-txt">
                  {R.n} día{R.n === 1 ? "" : "s"} seleccionado{R.n === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm text-d-txt-2">
                  {R.primera && bonita(R.primera)}
                  {R.ultima && R.ultima !== R.primera ? ` → ${bonita(R.ultima)}` : ""}
                  {R.pend ? ` · ${R.pend} sin cerrar (no cuenta${R.pend === 1 ? "" : "n"})` : ""}
                  {R.sinDatos ? ` · ${R.sinDatos} sin datos` : ""}
                </p>
                <div className="mt-3 flex flex-col gap-2.5">
                  {[
                    ["Total", R.sT],
                    ["Propias (Effi)", R.sP],
                    ["Dropi", R.sD],
                  ].map(([lbl, suma]) => (
                    <div key={lbl} className="rounded-card-sm bg-d-sup p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-d-txt-2">{lbl}</span>
                        <span className="text-lg font-black text-d-txt">{suma} prendas</span>
                      </div>
                      <p className="text-[12px] text-d-txt-2">
                        Promedio {prom(suma as number)} · {R.n} día{R.n === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-[13px] text-d-txt-2">
          Arrastrá sobre los días para seleccionar un rango (puede cruzar de un mes a otro). Un toque
          suelto agrega o quita ese día.
        </p>
      </div>
    </div>
  );
}
