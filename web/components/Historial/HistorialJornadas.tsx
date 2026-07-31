"use client";

import { useState } from "react";
import Link from "next/link";
import { claveFecha, bonita, MESES_L } from "@/lib/motor";
import type { Jornada } from "@/types/database";

/**
 * Historial de jornadas oficiales, en su propia página (botón "Ver historial
 * completo" en la cabecera del panel, abre acá en otra pestaña). Es de SOLO
 * LECTURA: a diferencia de <JornadasPanel>, no hay Excel cargado en esta
 * pestaña para recalcular el ranking, así que no ofrece cerrar/reabrir —
 * solo navegar meses y años anteriores para consultar lo ya oficial.
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
}: {
  mes: string;
  porDia: Record<string, Jornada>;
  abierta: string | null;
  onTocar: (k: string) => void;
}) {
  const [ano, mes1] = mes.split("-").map(Number);
  const hueco = (new Date(ano, mes1 - 1, 1).getDay() + 6) % 7;
  const ultimo = new Date(ano, mes1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < hueco; i++) celdas.push(<div key={`h${i}`} />);
  for (let d = 1; d <= ultimo; d++) {
    const k = claveFecha(ano, mes1, d);
    const j = porDia[k];
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

export function HistorialJornadas({ jornadas }: { jornadas: Jornada[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);

  const porDia: Record<string, Jornada> = {};
  jornadas.forEach((j) => (porDia[j.fecha] = j));

  const mesesSet = new Set<string>();
  jornadas.forEach((j) => mesesSet.add(j.fecha.slice(0, 7)));
  const listaM = [...mesesSet].sort().reverse();

  const anios = [...new Set(listaM.map((m) => m.slice(0, 4)))];

  function toggle(k: string) {
    setAbierta((prev) => (prev === k ? null : k));
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-black tracking-tight text-d-txt">Historial de jornadas</h2>
        <Link
          href="/admin"
          className="text-[13px] font-semibold text-turquesa hover:underline"
        >
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
                  className="rounded-full border border-d-sup-3 px-3 py-1 text-[12px] font-semibold text-d-txt-2 hover:border-turquesa hover:text-turquesa-prof"
                >
                  {a}
                </a>
              ))}
            </div>
          )}

          {anios.map((anio) => (
            <div key={anio} id={`anio-${anio}`}>
              <h3 className="mt-2 scroll-mt-4 text-[15px] font-black text-d-txt">{anio}</h3>
              {listaM
                .filter((m) => m.slice(0, 4) === anio)
                .map((m, idx) => {
                  const [ano, mes1] = m.split("-").map(Number);
                  const ultimo = new Date(ano, mes1, 0).getDate();
                  let suma = 0;
                  let rev = 0;
                  const venMes: Record<string, number> = {};
                  const tieMes: Record<string, number> = {};
                  let ksMes = 0;
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
                          {ksMes} día{ksMes === 1 ? "" : "s"} · {suma} prendas
                          {rev ? ` · ${rev} con revisión` : ""}
                        </span>
                      </summary>
                      <div className="flex flex-wrap items-center gap-8">
                        <div className="w-full max-w-[560px]">
                          <CalendarioSoloLectura
                            mes={m}
                            porDia={porDia}
                            abierta={abierta}
                            onTocar={toggle}
                          />
                        </div>
                        <ResumenMes total={suma} mejorVend={mejorVend} mejorTienda={mejorTienda} />
                      </div>
                      {abierta && abierta.slice(0, 7) === m && porDia[abierta] && (
                        <DetalleDia j={porDia[abierta]} />
                      )}
                    </details>
                  );
                })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
