"use client";

import { useMemo, useState } from "react";
import {
  calcular,
  datosDelMes,
  resumenTablero,
  bonita,
  claveFecha,
  MESES_L,
  SIN_TIENDA,
  type EntradaRanking,
} from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { useHidratarNube } from "@/lib/store/useHidratarNube";
import type { EstadoAdminInicial } from "@/lib/data/admin";
import { TableroChart } from "./TableroChart";

/**
 * Pestaña 2 · Tablero del mes (Fase 5). Selector de mes + toggle de bosquejo,
 * KPIs del mes, metas del periodo, dos gráficas (reales y repartidas, con línea
 * de meta escalonada) y los rankings por vendedor/tienda. Puerto de
 * pintarTablero() (quin-admin.html:1868-2006). Reusa el estado del store: las
 * jornadas/metas de la nube y, si hay un Excel cargado en la sesión, su bosquejo.
 */
function Kpi({
  etiqueta,
  valor,
  pie,
  destacada,
}: {
  etiqueta: string;
  valor: number | string;
  pie?: string;
  destacada?: boolean;
}) {
  return (
    <div
      className={`rounded-card-sm border p-3.5 ${
        destacada ? "border-turquesa/30 bg-turquesa/10" : "border-d-sup-3 bg-d-sup-2"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-d-txt-2">{etiqueta}</p>
      <p className="text-2xl font-black text-d-txt">{valor}</p>
      {pie && <p className="text-[12px] text-d-txt-2">{pie}</p>}
    </div>
  );
}

function MetaCard({ titulo, sub, valor, meta }: { titulo: string; sub: string; valor: number; meta: number }) {
  const pct = meta ? Math.min(100, Math.round((valor / meta) * 100)) : 0;
  return (
    <div className="rounded-card border border-d-sup-3 bg-d-sup p-5 shadow-card">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">{titulo}</p>
      <p className="text-sm font-semibold text-d-txt-2">{sub}</p>
      <p className="mb-2 mt-1 text-lg font-black text-d-txt">
        {valor} de {meta} prendas
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-d-sup-3">
        <div className="h-full rounded-full bg-turquesa" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-d-txt-2">
        {valor >= meta ? "Meta cumplida" : `Faltan ${meta - valor}`}
      </p>
    </div>
  );
}

const MEDALLA = ["bg-turquesa text-d-en-turquesa", "bg-turquesa/40 text-d-en-turquesa", "bg-turquesa/20 text-turquesa"];

function Ranking({ titulo, entradas, faltan, total }: { titulo: string; entradas: EntradaRanking[]; faltan: number; total: number }) {
  const max = entradas.length ? Math.max(...entradas.map((x) => x.n)) : 0;
  const suma = entradas.reduce((a, x) => a + x.n, 0);
  let pos = 0;
  return (
    <section>
      <h3 className="mb-3 text-lg font-black tracking-tight text-d-txt">{titulo}</h3>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-5 shadow-card">
        {faltan > 0 && (
          <p className="mb-3 rounded-card-sm border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12px] text-d-txt">
            <b>Faltan {faltan} de {total} jornadas.</b> Se cerraron antes de guardar el detalle por
            vendedor. Reabrilas y cerralas de nuevo para incluirlas.
          </p>
        )}
        {!entradas.length ? (
          <p className="text-[13px] text-d-txt-2">Sin detalle guardado todavía.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {entradas.map((x) => {
              const suelto = x.nombre === SIN_TIENDA;
              if (!suelto) pos++;
              const medalla = !suelto && pos <= 3 ? MEDALLA[pos - 1] : "bg-d-sup-3 text-d-txt-2";
              return (
                <div key={x.nombre} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${medalla}`}>
                    {suelto ? "—" : pos}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${suelto ? "text-red-400" : "text-d-txt"}`}>
                      {x.nombre}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-d-sup-3">
                      <div className="h-full rounded-full bg-turquesa" style={{ width: `${max ? Math.round((x.n / max) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-bold text-d-txt">
                    {x.n} <span className="font-semibold text-d-txt-2">· {suma ? Math.round((x.n * 100) / suma) : 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Leyenda({ hayBosquejo, etMeta }: { hayBosquejo: boolean; etMeta: string }) {
  return (
    <div className="mb-3 flex flex-wrap gap-4 text-[13px] text-d-txt-2">
      {hayBosquejo && (
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-3 w-3 rounded-sm bg-[#123b3d]" />
          Sin cerrar (bosquejo)
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-3 w-3 rounded-sm bg-turquesa" />
        Propias
      </span>
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-3 w-3 rounded-sm bg-[#5b8f94]" />
        Dropi
      </span>
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-0.5 w-[18px] bg-d-txt" />
        Meta {etMeta}
      </span>
    </div>
  );
}

const card = "rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card";
const aviso = "rounded-card-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-d-txt";

export function TableroPanel({ estadoInicial }: { estadoInicial: EstadoAdminInicial }) {
  useHidratarNube(estadoInicial);
  const {
    jornadas,
    metas,
    meses,
    filasDropi,
    filasEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    diasManuales,
  } = useCargar();

  const [mesSel, setMesSel] = useState("");
  const [incluirBosquejo, setIncluirBosquejo] = useState(true);

  const calc = useMemo(
    () =>
      calcular({ filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad, diasManuales }),
    [filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad, diasManuales]
  );

  const hoyK = (() => {
    const f = new Date();
    return claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate());
  })();

  // Meses disponibles: los de jornadas y, si se incluye el bosquejo, los del Excel.
  const meses_ = new Set<string>();
  Object.keys(jornadas).forEach((k) => meses_.add(k.slice(0, 7)));
  if (incluirBosquejo) calc.claves.forEach((k) => meses_.add(k.slice(0, 7)));
  const mesesDisp = [...meses_].sort().reverse();

  const mesActivo = mesSel && mesesDisp.includes(mesSel) ? mesSel : mesesDisp[0];

  // El React Compiler memoiza esto solo; sin useMemo manual (que no puede
  // preservar la dependencia `calc.dias`).
  const R = mesActivo
    ? resumenTablero(datosDelMes(jornadas, calc.dias, mesActivo, incluirBosquejo), metas, hoyK)
    : null;

  if (!mesesDisp.length || !R || !mesActivo) {
    return (
      <div className="mx-auto max-w-[1240px]">
        <h1 className="mb-2 text-[26px] font-black tracking-tight text-d-txt">2 · Tablero del mes</h1>
        <div className={aviso}>
          <b>Todavía no hay nada que mostrar.</b> Andá a <b>1 · Cargar y validar</b> y subí los dos
          Excel, o cerrá jornadas de algún mes.
        </div>
      </div>
    );
  }

  const rangoMeta = (a: number[]) => {
    if (!a.length) return "—";
    const mn = Math.min(...a);
    const mx = Math.max(...a);
    return mn === mx ? String(mn) : `${mn}–${mx}`;
  };
  const etMetaT = rangoMeta(R.metaT);
  const etMetaP = rangoMeta(R.metaP);
  const eMes = meses[mesActivo];
  const plural = (x: number) => (x === 1 ? "" : "s");

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
      <div>
        <h1 className="mb-2 text-[26px] font-black tracking-tight text-d-txt">2 · Tablero del mes</h1>
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={mesActivo}
            onChange={(e) => setMesSel(e.target.value)}
            className="rounded-lg border border-d-sup-3 bg-d-sup-2 px-3 py-1.5 text-sm text-d-txt outline-none focus:outline-2 focus:outline-turquesa"
          >
            {mesesDisp.map((m) => {
              const [y, mm] = m.split("-");
              return (
                <option key={m} value={m}>
                  {MESES_L[+mm - 1]} {y}
                </option>
              );
            })}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-d-txt-2">
            <input
              type="checkbox"
              checked={incluirBosquejo}
              onChange={(e) => setIncluirBosquejo(e.target.checked)}
              className="h-4 w-4 accent-turquesa"
            />
            Incluir días sin cerrar (bosquejo)
          </label>
        </div>
      </div>

      {eMes && eMes.datos.estado === "cerrado" && (
        <div className="rounded-card-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-d-txt">
          <b>Mes cerrado.</b> Se selló el {eMes.datos.cerrado} con{" "}
          <b>{eMes.datos.resumen?.total}</b> prendas en {eMes.datos.resumen?.dias} días. Esa es la
          cifra oficial.
        </div>
      )}
      {eMes && eMes.datos.estado === "abierto" && (
        <div className={aviso}>
          <b>Mes reabierto.</b> Le quitaste el sello, así que no tiene cifra oficial de cierre hasta
          que lo vuelvas a sellar.
        </div>
      )}
      {R.abiertas > 0 && (
        <div className={aviso}>
          <b>Bosquejo.</b> Estás viendo {R.abiertas} día{plural(R.abiertas)} sin cerrar
          {R.cerradasN ? `, junto con ${R.cerradasN} ya cerrado${plural(R.cerradasN)}` : ""}. Las
          cifras pueden cambiar hasta que cierres esas jornadas.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">
          Resumen del mes{R.abiertas ? " (bosquejo)" : ""}
        </h2>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi etiqueta="Total del mes" valor={R.total} pie={`prendas${R.abiertas ? " · incluye bosquejo" : ""}`} destacada />
          <Kpi etiqueta="Promedio por día" valor={R.prom} pie={`${R.n} día${plural(R.n)}`} />
          <Kpi etiqueta="Propias (Effi)" valor={R.tP} pie={`${R.pct}% del total`} />
          <Kpi etiqueta="Dropi" valor={R.tD} pie={`${100 - R.pct}% del total`} />
          <Kpi etiqueta="Ventas de hoy" valor={R.hoy == null ? "—" : R.hoy} pie={R.hoy == null ? "jornada sin cargar" : bonita(hoyK)} />
          <Kpi etiqueta="Jornadas cerradas" valor={R.cerradasN} pie={R.abiertas ? `${R.abiertas} sin cerrar` : ""} />
          <Kpi etiqueta="Mejor jornada" valor={R.mejor ? R.mejor.t : "—"} pie={R.mejor ? bonita(R.mejor.k) : ""} />
          <Kpi etiqueta="Jornada más baja" valor={R.peor ? R.peor.t : "—"} pie={R.peor ? bonita(R.peor.k) : ""} />
          <Kpi etiqueta="Días en meta total" valor={R.enMetaT} pie={`de ${R.n} · meta ${etMetaT}`} />
          <Kpi etiqueta="Días en meta propias" valor={R.enMetaP} pie={`de ${R.n} · meta ${etMetaP}`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Metas del mes</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <MetaCard titulo="META TOTAL" sub="Effi + Dropi" valor={R.total} meta={R.metaSumaT} />
          <MetaCard titulo="META PROPIAS" sub="Solo Effi" valor={R.tP} meta={R.metaSumaP} />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-[22px] font-black tracking-tight text-d-txt">Ventas reales — día por día</h2>
        <p className="mb-3 text-sm text-d-txt-2">Lo que de verdad cayó cada día, sin repartir.</p>
        <div className={card}>
          <Leyenda hayBosquejo={R.abiertas > 0} etMeta={etMetaT} />
          <TableroChart claves={R.claves} propias={R.realP} dropi={R.realD} cerradas={R.cerradas} metaDia={R.metaT} />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-[22px] font-black tracking-tight text-d-txt">
          Ventas repartidas — como las ve el vendedor
        </h2>
        <p className="mb-3 text-sm text-d-txt-2">Los bloques repartidos entre sus días, con el sobrante al último.</p>
        <div className={card}>
          <Leyenda hayBosquejo={R.abiertas > 0} etMeta={etMetaT} />
          <TableroChart claves={R.claves} propias={R.repP} dropi={R.repD} cerradas={R.cerradas} metaDia={R.metaT} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ranking titulo="Ranking de vendedores — Effi (propias)" entradas={R.rankingVend} faltan={R.faltan} total={R.n} />
        <Ranking titulo="Ranking de tiendas — Dropi" entradas={R.rankingTie} faltan={R.faltan} total={R.n} />
      </div>
    </div>
  );
}
