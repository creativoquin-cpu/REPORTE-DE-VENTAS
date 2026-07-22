"use client";

import { useMemo, useState } from "react";
import {
  calcular,
  datosDelMes,
  mesesComparables,
  resumenCmp,
  corteComun,
  delta,
  topCmp,
  tablaPersonas,
  difSellado,
  bonita,
  MESES_L,
  type Delta,
  type ResumenCmp,
  type FilaPersona,
} from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { useHidratarNube } from "@/lib/store/useHidratarNube";
import type { EstadoAdminInicial } from "@/lib/data/admin";
import { ComparativoChart } from "./ComparativoChart";

/**
 * Pestaña 4 · Comparativo (Fase 7, solo lectura). Tabla mes a mes con deltas,
 * gráfica combinada (barras apiladas + promedio por día) y las tablas de
 * vendedores y tiendas mes a mes. Puerto de pintarComparativo()
 * (quin-admin.html:2512-2585). Reusa el estado del store: jornadas/metas de la
 * nube + el bosquejo del Excel de la sesión.
 */
function nombreMes(m: string): string {
  const [y, mm] = m.split("-");
  return `${MESES_L[+mm - 1]} ${y}`;
}

function Var({ d }: { d: Delta | null }) {
  if (!d) return <span className="text-d-txt-2">—</span>;
  if (!d.dif) return <span className="text-d-txt-2">=</span>;
  const sube = d.dif > 0;
  return (
    <span className={`font-semibold ${sube ? "text-emerald-400" : "text-red-400"}`}>
      {sube ? "▲ +" : "▼ "}
      {d.dif}
      {d.pct ? ` (${sube ? "+" : "−"}${d.pct}%)` : ""}
    </span>
  );
}

const card = "rounded-card border border-d-sup-3 bg-d-sup p-5 shadow-card";
const aviso = "rounded-card-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-d-txt";
const th = "px-3 py-2 text-right text-[12px] font-bold uppercase tracking-wide text-d-txt-2";
const td = "px-3 py-2 text-right tabular-nums text-d-txt";

function TablaPersonas({ filas, meses, etiqueta }: { filas: FilaPersona[]; meses: string[]; etiqueta: string }) {
  if (!filas.length)
    return (
      <div className={card}>
        <p className="text-[13px] text-d-txt-2">Sin detalle guardado todavía.</p>
      </div>
    );
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-d-sup-3">
            <th className={`${th} text-left`}>{etiqueta}</th>
            {meses.map((m) => (
              <th key={m} className={th}>
                {nombreMes(m)}
              </th>
            ))}
            <th className={th}>Total</th>
            <th className={th}>Último vs anterior</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre} className="border-b border-d-sup-3/60 last:border-0">
              <td className={`${td} text-left font-semibold`}>{f.nombre}</td>
              {f.serie.map((v, i) => (
                <td key={meses[i]} className={td}>
                  {v || "—"}
                </td>
              ))}
              <td className={`${td} font-black`}>{f.total}</td>
              <td className={td}>
                <Var d={f.delta} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComparativoPanel({ estadoInicial }: { estadoInicial: EstadoAdminInicial }) {
  useHidratarNube(estadoInicial);
  const {
    jornadas,
    meses: sellos,
    filasDropi,
    filasEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    diasManuales,
  } = useCargar();

  const [incluirBosquejo, setIncluirBosquejo] = useState(true);
  const [mismoNumeroDias, setMismoNumeroDias] = useState(false);

  const calc = useMemo(
    () =>
      calcular({ filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad, diasManuales }),
    [filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad, diasManuales]
  );

  // Sin useMemo manual: el React Compiler no puede preservar una memoización
  // cuya dependencia es `calc.dias` (miembro), y lo memoiza solo igual de bien.
  const meses = mesesComparables(jornadas, calc.dias, incluirBosquejo);
  const datos = meses.map((m) => datosDelMes(jornadas, calc.dias, m, incluirBosquejo));
  const corte = mismoNumeroDias ? corteComun(datos.map((D) => Object.keys(D).length)) : 0;
  const R: ResumenCmp[] = meses.map((m, i) => resumenCmp(m, datos[i], corte));

  const toggle = (checked: boolean, onChange: (v: boolean) => void, texto: string) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-d-txt-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-turquesa"
      />
      {texto}
    </label>
  );

  const controles = (
    <div className={`${card} flex flex-wrap items-center gap-5`}>
      {toggle(incluirBosquejo, setIncluirBosquejo, "Incluir días sin cerrar (bosquejo)")}
      {toggle(mismoNumeroDias, setMismoNumeroDias, "Comparar el mismo número de días")}
    </div>
  );

  if (!meses.length) {
    return (
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4">
        <h1 className="text-[26px] font-black tracking-tight text-d-txt">4 · Comparativo</h1>
        {controles}
        <div className={aviso}>
          <b>Todavía no hay meses para comparar.</b> Subí los dos Excel en{" "}
          <b>1 · Cargar y validar</b> o cerrá jornadas de más de un mes.
        </div>
      </div>
    );
  }

  const conAbiertas = R.filter((r) => r.abiertas).length;
  const plural = (x: number) => (x === 1 ? "" : "s");

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
      <h1 className="text-[26px] font-black tracking-tight text-d-txt">4 · Comparativo</h1>
      {controles}

      {meses.length === 1 && (
        <div className={aviso}>
          Solo hay <b>un mes</b> con datos, así que no hay contra qué comparar todavía. Cuando entren
          jornadas de otro mes, acá vas a ver la evolución.
        </div>
      )}
      {corte > 0 && (
        <div className="rounded-card-sm border border-d-sup-3 bg-d-sup-2 px-4 py-3 text-[13px] text-d-txt-2">
          Comparando <b className="text-d-txt">los primeros {corte} día{plural(corte)} con datos</b> de
          cada mes, para que el mes en curso no salga castigado frente a los meses completos.
        </div>
      )}
      {conAbiertas > 0 && (
        <div className={aviso}>
          <b>Hay bosquejo.</b> {conAbiertas} mes{conAbiertas === 1 ? "" : "es"} incluye
          {conAbiertas === 1 ? "" : "n"} días cargados sin cerrar. Desmarcá la casilla de arriba para
          ver solo lo oficial.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Mes a mes</h2>
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-d-sup-3">
                <th className={`${th} text-left`}>Mes</th>
                <th className={th}>Días</th>
                <th className={th}>Total</th>
                <th className={th}>vs mes anterior</th>
                <th className={th}>Propias</th>
                <th className={th}>Dropi</th>
                <th className={th}>% Propias</th>
                <th className={th}>Promedio/día</th>
                <th className={`${th} text-left`}>Mejor día</th>
                <th className={`${th} text-left`}>Día más bajo</th>
              </tr>
            </thead>
            <tbody>
              {R.map((r, i) => {
                const sello = sellos[r.mes]?.datos;
                const dif = difSellado(sello, jornadas, r.mes);
                return (
                  <tr key={r.mes} className="border-b border-d-sup-3/60 last:border-0">
                    <td className={`${td} text-left`}>
                      <b>{nombreMes(r.mes)}</b>
                      {r.abiertas > 0 && (
                        <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          {r.abiertas} sin cerrar
                        </span>
                      )}
                      {sello?.estado === "cerrado" ? (
                        <p className={`text-[12px] ${dif && dif.dif ? "text-red-400" : "text-emerald-400"}`}>
                          sellado en {sello.resumen?.total}
                          {dif && dif.dif ? ` · difiere ${dif.dif > 0 ? "+" : ""}${dif.dif}` : ""}
                        </p>
                      ) : (
                        sello && <p className="text-[12px] text-amber-400">reabierto</p>
                      )}
                    </td>
                    <td className={td}>{r.n}</td>
                    <td className={`${td} font-black`}>{r.total}</td>
                    <td className={td}>
                      <Var d={delta(r.total, i ? R[i - 1].total : null)} />
                    </td>
                    <td className={td}>{r.p}</td>
                    <td className={td}>{r.d}</td>
                    <td className={td}>{r.pct}%</td>
                    <td className={td}>{r.prom}</td>
                    <td className={`${td} text-left`}>
                      {r.mejor ? `${r.mejor.t} · ${bonita(r.mejor.k)}` : "—"}
                    </td>
                    <td className={`${td} text-left`}>
                      {r.peor ? `${r.peor.t} · ${bonita(r.peor.k)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Evolución</h2>
        <div className={card}>
          <div className="mb-3 flex flex-wrap gap-4 text-[13px] text-d-txt-2">
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-3 w-3 rounded-sm bg-[#17c3c3]" />
              Propias
            </span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-3 w-3 rounded-sm bg-[#1baf7a]" />
              Dropi
            </span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-0.5 w-[18px] bg-[#e0a030]" />
              Promedio por día
            </span>
          </div>
          <ComparativoChart resumenes={R} etiquetas={meses.map(nombreMes)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Top del mes</h2>
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-d-sup-3">
                <th className={`${th} text-left`}>Mes</th>
                <th className={`${th} text-left`}>Top vendedor (Effi)</th>
                <th className={`${th} text-left`}>Top tienda (Dropi)</th>
              </tr>
            </thead>
            <tbody>
              {R.map((r) => {
                const tv = topCmp(r.ven);
                const tt = topCmp(r.tie);
                return (
                  <tr key={r.mes} className="border-b border-d-sup-3/60 last:border-0">
                    <td className={`${td} text-left font-semibold`}>{nombreMes(r.mes)}</td>
                    <td className={`${td} text-left`}>{tv ? `${tv.nombre} (${tv.n})` : "—"}</td>
                    <td className={`${td} text-left`}>{tt ? `${tt.nombre} (${tt.n})` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">
          Vendedores mes a mes — Effi
        </h2>
        <TablaPersonas filas={tablaPersonas(R, "ven")} meses={meses} etiqueta="Vendedor" />
      </section>

      <section>
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">
          Tiendas mes a mes — Dropi
        </h2>
        <TablaPersonas filas={tablaPersonas(R, "tie")} meses={meses} etiqueta="Tienda" />
      </section>
    </div>
  );
}
