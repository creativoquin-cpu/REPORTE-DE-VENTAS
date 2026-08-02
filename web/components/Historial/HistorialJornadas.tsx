"use client";

import { useState } from "react";
import Link from "next/link";
import {
  claveFecha,
  bonita,
  MESES_L,
  datosDelMes,
  resumenTablero,
  type JornadaTablero,
  type MetaHistorial,
} from "@/lib/motor";
import { TableroChart } from "@/components/Tablero/TableroChart";
import type { Jornada } from "@/types/database";

/**
 * Historial de jornadas oficiales, en su propia página (botón "Ver historial
 * completo" en la cabecera del panel, abre acá en otra pestaña). Es de SOLO
 * LECTURA: a diferencia de <JornadasPanel>, no hay Excel cargado en esta
 * pestaña para recalcular el ranking, así que no ofrece cerrar/reabrir —
 * solo navegar meses y años anteriores para consultar lo ya oficial.
 *
 * Organización: los años son despliegues (<details>, uno o varios abiertos a
 * la vez) y, dentro de cada uno, los meses son botones — al elegir uno se
 * muestra debajo su calendario, resumen y gráfico (con la meta vigente ese
 * mes), marcando además qué días estaban configurados como no laborables o
 * sin ventas.
 */

const DOW = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

function top(mapa: Record<string, number>): { nombre: string; n: number } | null {
  let mejor: { nombre: string; n: number } | null = null;
  for (const [nombre, n] of Object.entries(mapa)) {
    if (!mejor || n > mejor.n) mejor = { nombre, n };
  }
  return mejor;
}

function CalendarioSoloLectura({
  mes,
  porDia,
  abierta,
  onTocar,
  noLaborables,
  sinVentas,
}: {
  mes: string;
  porDia: Record<string, Jornada>;
  abierta: string | null;
  onTocar: (k: string) => void;
  noLaborables: Record<string, unknown>;
  sinVentas: Record<string, unknown>;
}) {
  const [ano, mes1] = mes.split("-").map(Number);
  const hueco = (new Date(ano, mes1 - 1, 1).getDay() + 6) % 7;
  const ultimo = new Date(ano, mes1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < hueco; i++) celdas.push(<div key={`h${i}`} />);
  for (let d = 1; d <= ultimo; d++) {
    const k = claveFecha(ano, mes1, d);
    const j = porDia[k];
    const esNoLaborable = !!noLaborables[k];
    const esSinVentas = !!sinVentas[k];
    let clase = "border border-d-sup-3 bg-d-sup-3/40 text-d-txt-2";
    let val = "·";
    let tip = "sin datos";
    let onClick: (() => void) | undefined;
    let extra = "";
    if (j) {
      const revisada = j.fotos.length > 0;
      clase = revisada
        ? "border border-amber-500/50 bg-amber-500/15 text-d-txt cursor-pointer"
        : "border border-turquesa/30 bg-turquesa/10 text-d-txt cursor-pointer";
      val = String(j.propias + j.dropi);
      tip = revisada ? "cerrada, con revisión" : "cerrada";
      onClick = () => onTocar(k);
      if (abierta === k) extra = " outline outline-2 outline-turquesa";
    }
    if (esNoLaborable) tip += " · no laborable";
    if (esSinVentas) tip += " · sin ventas";
    celdas.push(
      <div
        key={k}
        title={tip}
        onClick={onClick}
        className={`relative flex min-h-[46px] flex-col rounded-md p-1 ${clase}${extra}`}
      >
        <span className="text-[11px] leading-none text-d-txt-2">{d}</span>
        <span className="mt-auto text-right text-[13px] font-semibold tabular-nums">{val}</span>
        {(esNoLaborable || esSinVentas) && (
          <i
            className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${
              esSinVentas ? "bg-red-500" : "bg-turquesa"
            }`}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {DOW.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-semibold text-d-txt-2">
            {d}
          </div>
        ))}
        {celdas}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-d-txt-2">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-1.5 w-1.5 rounded-full bg-turquesa" />
          No laborable
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
          Sin ventas
        </span>
      </div>
    </div>
  );
}

function ResumenMes({
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
      <p className="eyebrow">Resumen del mes</p>
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
            {mejorVend ? `${mejorVend.n} propias` : "sin datos"}
          </p>
        </div>
        <div className="rounded-card-sm border border-d-sup-3 bg-d-sup p-3">
          <p className="eyebrow text-[0.62rem]">Mejor tienda · Dropi</p>
          <p className="mt-1 truncate font-black text-d-txt">
            {mejorTienda ? mejorTienda.nombre : "—"}
          </p>
          <p className="text-[13px] text-d-txt-2">
            {mejorTienda ? `${mejorTienda.n} Dropi` : "sin datos"}
          </p>
        </div>
      </div>
    </aside>
  );
}

function DetalleDia({ j }: { j: Jornada }) {
  const oficial = j.propias + j.dropi;
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
            <td className="py-1 text-d-txt-2">Cerrada el</td>
            <td className="py-1 text-right text-d-txt">{j.cerrada_el || j.fecha}</td>
          </tr>
        </tbody>
      </table>
      {j.fotos.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[13px] font-semibold text-d-txt">Revisiones posteriores</p>
          <ul className="space-y-0.5 text-[13px] text-d-txt-2">
            {j.fotos.map((f, i) => (
              <li key={i}>
                {f.cuando}: {f.p + f.d} ({f.p} propias · {f.d} Dropi)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Gráfico del mes (mismo que "2 · Tablero del mes"), armado solo con lo ya
 * cerrado — sin bosquejo de Excel, que acá no existe. La meta que traza es la
 * vigente en cada día de ESE mes (historial versionado, ver lib/motor/metas.ts). */
function GraficoMes({
  mes,
  porDia,
  metas,
  diasNulos,
}: {
  mes: string;
  porDia: Record<string, Jornada>;
  metas: MetaHistorial[];
  diasNulos: Record<string, unknown>;
}) {
  const jornadasMes: Record<string, JornadaTablero> = {};
  Object.keys(porDia).forEach((k) => {
    if (k.slice(0, 7) !== mes) return;
    const j = porDia[k];
    jornadasMes[k] = { propias: j.propias, dropi: j.dropi, ven: j.ven, tie: j.tie };
  });
  const D = datosDelMes(jornadasMes, {}, mes, false, diasNulos);
  const R = resumenTablero(D, metas, `${mes}-01`);
  if (!R.n) return null;

  return (
    <div className="mt-4 rounded-card-sm border border-d-sup-3 bg-d-sup-2 p-4">
      <p className="mb-3 text-[13px] font-semibold text-d-txt-2">Ventas del mes · día por día</p>
      <TableroChart
        claves={R.claves}
        propias={R.realP}
        dropi={R.realD}
        cerradas={R.cerradas}
        metaDia={R.metaT}
        metaPropiasDia={R.metaP}
      />
    </div>
  );
}

interface InfoMes {
  ksMes: number;
  suma: number;
  rev: number;
  mejorVend: { nombre: string; n: number } | null;
  mejorTienda: { nombre: string; n: number } | null;
}

/** Calendario + resumen + gráfico del mes elegido. */
function DetalleMes({
  mes,
  porDia,
  metas,
  diasNulos,
  diasManuales,
  abierta,
  onTocar,
  info,
}: {
  mes: string;
  porDia: Record<string, Jornada>;
  metas: MetaHistorial[];
  diasNulos: Record<string, unknown>;
  diasManuales: Record<string, unknown>;
  abierta: string | null;
  onTocar: (k: string) => void;
  info: InfoMes;
}) {
  return (
    <div className="mt-4 border-t border-d-sup-3 pt-4">
      <div className="flex flex-wrap items-center gap-8">
        <div className="w-full max-w-[560px]">
          <CalendarioSoloLectura
            mes={mes}
            porDia={porDia}
            abierta={abierta}
            onTocar={onTocar}
            noLaborables={diasManuales}
            sinVentas={diasNulos}
          />
        </div>
        <ResumenMes total={info.suma} mejorVend={info.mejorVend} mejorTienda={info.mejorTienda} />
      </div>
      {abierta && abierta.slice(0, 7) === mes && porDia[abierta] && <DetalleDia j={porDia[abierta]} />}
      <GraficoMes mes={mes} porDia={porDia} metas={metas} diasNulos={diasNulos} />
    </div>
  );
}

const botonMes = (activo: boolean) =>
  `rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
    activo
      ? "border-turquesa bg-turquesa text-d-en-turquesa"
      : "border-d-sup-3 bg-d-sup-2 text-d-txt-2 hover:border-turquesa hover:text-d-txt"
  }`;

export function HistorialJornadas({
  jornadas,
  metas,
  diasNulos,
  diasManuales,
}: {
  jornadas: Jornada[];
  metas: MetaHistorial[];
  diasNulos: string[];
  diasManuales: string[];
}) {
  const [abierta, setAbierta] = useState<string | null>(null);

  const porDia: Record<string, Jornada> = {};
  jornadas.forEach((j) => (porDia[j.fecha] = j));

  const mesesSet = new Set<string>();
  jornadas.forEach((j) => mesesSet.add(j.fecha.slice(0, 7)));
  const listaM = [...mesesSet].sort().reverse();

  const anios = [...new Set(listaM.map((m) => m.slice(0, 4)))];

  const diasNulosMapa: Record<string, true> = {};
  diasNulos.forEach((f) => (diasNulosMapa[f] = true));
  const diasManualesMapa: Record<string, true> = {};
  diasManuales.forEach((f) => (diasManualesMapa[f] = true));

  const [aniosAbiertos, setAniosAbiertos] = useState<Set<string>>(
    () => new Set(anios[0] ? [anios[0]] : [])
  );
  const [mesSel, setMesSel] = useState<string | null>(listaM[0] ?? null);

  function toggle(k: string) {
    setAbierta((prev) => (prev === k ? null : k));
  }

  function elegirMes(m: string) {
    setMesSel(m);
    setAbierta(null);
  }

  function alAlternarAnio(anio: string, abierto: boolean) {
    setAniosAbiertos((prev) => {
      const next = new Set(prev);
      if (abierto) next.add(anio);
      else next.delete(anio);
      return next;
    });
  }

  function calcularMes(m: string): InfoMes {
    const [ano, mes1] = m.split("-").map(Number);
    const ultimo = new Date(ano, mes1, 0).getDate();
    let suma = 0;
    let rev = 0;
    let ksMes = 0;
    const venMes: Record<string, number> = {};
    const tieMes: Record<string, number> = {};
    for (let d = 1; d <= ultimo; d++) {
      const k = claveFecha(ano, mes1, d);
      const j = porDia[k];
      if (!j) continue;
      ksMes++;
      suma += j.propias + j.dropi;
      if (j.fotos.length) rev++;
      for (const [v, nn] of Object.entries(j.ven)) venMes[v] = (venMes[v] || 0) + nn;
      for (const [t, nn] of Object.entries(j.tie)) tieMes[t] = (tieMes[t] || 0) + nn;
    }
    return { ksMes, suma, rev, mejorVend: top(venMes), mejorTienda: top(tieMes) };
  }

  const infoMesSel = mesSel ? calcularMes(mesSel) : null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-black tracking-tight text-d-txt">Historial de jornadas</h2>
        <Link href="/admin" className="text-[13px] font-semibold text-turquesa hover:underline">
          ← Volver al panel
        </Link>
      </div>

      {!listaM.length ? (
        <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 text-sm text-d-txt-2 shadow-card">
          Todavía no hay jornadas cerradas en la nube.
        </div>
      ) : (
        <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
          <p className="mb-4 text-[13px] text-d-txt-2">
            <b className="text-d-txt">{jornadas.length}</b> jornada
            {jornadas.length === 1 ? "" : "s"} cerrada{jornadas.length === 1 ? "" : "s"} en{" "}
            <b className="text-d-txt">{listaM.length}</b> mes{listaM.length === 1 ? "" : "es"}
            {anios.length > 1 ? (
              <>
                , desde <b className="text-d-txt">{anios[anios.length - 1]}</b> hasta{" "}
                <b className="text-d-txt">{anios[0]}</b>.
              </>
            ) : (
              <>
                {" "}
                en <b className="text-d-txt">{anios[0]}</b>.
              </>
            )}
          </p>

          {anios.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2 border-b border-d-sup-3 pb-4">
              <span className="text-[12px] text-d-txt-2">Ir a:</span>
              {anios.map((a) => (
                <a
                  key={a}
                  href={`#anio-${a}`}
                  onClick={() => alAlternarAnio(a, true)}
                  className="rounded-full border border-d-sup-3 px-3 py-1 text-[12px] font-semibold text-d-txt-2 hover:border-turquesa hover:text-turquesa-prof"
                >
                  {a}
                </a>
              ))}
            </div>
          )}

          {anios.map((anio) => {
            const diasAnio = jornadas.filter((j) => j.fecha.slice(0, 4) === anio).length;
            const mesesAnio = listaM.filter((m) => m.slice(0, 4) === anio);
            return (
              <details
                key={anio}
                id={`anio-${anio}`}
                open={aniosAbiertos.has(anio)}
                onToggle={(e) => alAlternarAnio(anio, e.currentTarget.open)}
                className="scroll-mt-4 border-t border-d-sup-3 py-2 first:border-t-0"
              >
                <summary className="cursor-pointer text-[15px] font-black text-d-txt">
                  {anio}
                  <span className="ml-2 text-[12px] font-semibold text-d-txt-2">
                    {diasAnio} día{diasAnio === 1 ? "" : "s"}
                  </span>
                </summary>

                <div className="mt-2 flex flex-wrap gap-2">
                  {mesesAnio.map((m) => {
                    const [, mes1] = m.split("-").map(Number);
                    const activo = mesSel === m;
                    const info = calcularMes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => elegirMes(m)}
                        className={botonMes(activo)}
                      >
                        <span className="capitalize">{MESES_L[mes1 - 1]}</span>{" "}
                        <span className={activo ? "opacity-85" : "text-d-txt-2"}>{info.suma}</span>
                      </button>
                    );
                  })}
                </div>

                {mesSel && mesSel.slice(0, 4) === anio && infoMesSel && (
                  <DetalleMes
                    mes={mesSel}
                    porDia={porDia}
                    metas={metas}
                    diasNulos={diasNulosMapa}
                    diasManuales={diasManualesMapa}
                    abierta={abierta}
                    onTocar={toggle}
                    info={infoMesSel}
                  />
                )}
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
