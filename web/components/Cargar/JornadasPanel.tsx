"use client";

import { useState } from "react";
import { claveFecha, bonita, MESES_L, type ResultadoCalculo } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import type { Jornada } from "@/types/database";

/**
 * Panel "Jornadas" (Fase 4b-1, SOLO LECTURA). Puerto de renderCongelado()
 * (quin-admin.html:1452-1631) sin las acciones que escriben: muestra, mes por
 * mes, un calendario con el estado de cada día (cerrada / cargada sin cerrar /
 * con revisión / sin datos) y, al tocar un día cerrado, su detalle oficial.
 *
 * Cerrar, reabrir, marcar y borrar llegan en 4b-2 (escrituras dirigidas).
 */

const DOW = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

function DetalleJornada({ j }: { j: Jornada }) {
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
      <p className="mt-2 text-[12px] text-d-txt-2">
        Reabrir esta jornada llega en la próxima sub-entrega (4b-2).
      </p>
    </div>
  );
}

function CalendarioMes({
  mes,
  jornadas,
  dias,
  abierta,
  onTocar,
}: {
  mes: string;
  jornadas: Record<string, Jornada>;
  dias: ResultadoCalculo["dias"];
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
    const j = jornadas[k];
    const c = dias[k];
    let clase = "border border-d-sup-3 bg-d-sup-3/40 text-d-txt-2";
    let val = "·";
    let tip = "";
    let clickable = false;
    if (j) {
      const revisada = j.fotos.length > 0;
      clase = revisada
        ? "border border-amber-500/50 bg-amber-500/15 text-d-txt cursor-pointer"
        : "border border-turquesa/30 bg-turquesa/10 text-d-txt cursor-pointer";
      val = String(j.propias + j.dropi);
      tip = revisada ? "cerrada, con revisión" : "cerrada";
      clickable = true;
    } else if (c) {
      clase = "border border-d-sup-3 bg-d-sup-2 text-d-txt";
      val = String(c.propias + c.dropi);
      tip = "cargada, sin cerrar";
    }
    const sel = abierta === k ? " outline outline-2 outline-turquesa" : "";
    celdas.push(
      <div
        key={k}
        title={tip}
        onClick={clickable ? () => onTocar(k) : undefined}
        className={`flex min-h-[46px] flex-col rounded-md p-1 ${clase}${sel}`}
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

export function JornadasPanel({ resultado }: { resultado: ResultadoCalculo }) {
  const { jornadas } = useCargar();
  const [abierta, setAbierta] = useState<string | null>(null);
  const { dias, claves } = resultado;

  const mesesSet = new Set<string>();
  claves.forEach((k) => mesesSet.add(k.slice(0, 7)));
  Object.keys(jornadas).forEach((k) => mesesSet.add(k.slice(0, 7)));
  const listaM = [...mesesSet].sort().reverse();

  if (!listaM.length) return null;

  const pendTot = claves.filter((k) => !jornadas[k]).length;
  const histTot = Object.keys(jornadas).length;

  function tocar(k: string) {
    setAbierta((prev) => (prev === k ? null : k));
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
          for (let d = 1; d <= ultimo; d++) {
            const k = claveFecha(ano, mes1, d);
            const j = jornadas[k];
            const c = dias[k];
            if (!j && !c) continue;
            ksMes++;
            suma += j ? j.propias + j.dropi : c.propias + c.dropi;
            if (!j) pend++;
            if (j && j.fotos.length) rev++;
          }
          return (
            <details key={m} open={idx === 0} className="border-t border-d-sup-3 py-2">
              <summary className="cursor-pointer text-sm text-d-txt">
                <span className="font-semibold capitalize">
                  {MESES_L[mes1 - 1]} {ano}
                </span>
                <span className="text-d-txt-2">
                  {" · "}
                  {ksMes} día{ksMes === 1 ? "" : "s"} · {suma} prendas ·{" "}
                  {pend ? (
                    <b className="text-amber-400">{pend} sin cerrar</b>
                  ) : (
                    "todas cerradas"
                  )}
                  {rev ? ` · ${rev} con revisión` : ""}
                </span>
              </summary>
              <CalendarioMes
                mes={m}
                jornadas={jornadas}
                dias={dias}
                abierta={abierta}
                onTocar={tocar}
              />
              {abierta && abierta.slice(0, 7) === m && jornadas[abierta] && (
                <DetalleJornada j={jornadas[abierta]} />
              )}
            </details>
          );
        })}

        {histTot > 0 && (
          <p className="mt-3 text-[12px] text-d-txt-2">
            Toca un día <b className="text-d-txt">cerrado</b> para ver su detalle.
          </p>
        )}
      </div>
    </section>
  );
}
