"use client";

import { useMemo, useState } from "react";
import { calcular, diagnosticar } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { useHidratarNube } from "@/lib/store/useHidratarNube";
import type { EstadoAdminInicial } from "@/lib/data/admin";
import { CargadorTodo } from "./CargadorTodo";
import { Filtros } from "./Filtros";
import { ResumenCarga } from "./ResumenCarga";
import { ResumenVigencia } from "./ResumenVigencia";
import { TablaPorDia } from "./TablaPorDia";
import { RankingTabla } from "./RankingTabla";
import { Descartes } from "./Descartes";
import { MetasPanel } from "./MetasPanel";
import { DiasNoLaborablesPanel } from "./DiasNoLaborablesPanel";
import { DiaNuloPanel } from "./DiaNuloPanel";
import { CorteJornadaPanel } from "./CorteJornadaPanel";
import { JornadasPanel } from "./JornadasPanel";
import { CierrePanel } from "./CierrePanel";

type TabId = "metas-corte" | "jornadas-cierre";

const TABS: { id: TabId; label: string }[] = [
  { id: "metas-corte", label: "Metas y corte de jornada" },
  { id: "jornadas-cierre", label: "Jornadas y cierre mensual" },
];

/**
 * Pestaña 1 · Cargar y validar.
 *
 * Fase 4a: carga de los dos Excel, filtros y tablas de validación, recalculadas
 * en vivo con el motor puro.
 * Fase 4b-1: se hidrata con el estado real de la nube (jornadas oficiales,
 * sellos mensuales, días no laborables y ajustes guardados) — todo de SOLO
 * LECTURA. Así el cálculo respeta los días no laborables reales, el resumen
 * muestra cuántos días siguen sin cerrar, y los paneles de jornadas y cierre
 * reflejan lo que hay en producción. Cerrar/reabrir/sellar (escrituras) van en
 * 4b-2.
 */
export function PanelCargar({ estadoInicial }: { estadoInicial: EstadoAdminInicial }) {
  const {
    filasDropi,
    filasEffi,
    estadoDropi,
    estadoEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    diasManuales,
    corteJornada,
    nubeError,
    ponerEstadoDropi,
    ponerEstadoEffi,
    cargarDropi,
    cargarEffi,
  } = useCargar();
  const [tab, setTab] = useState<TabId>("metas-corte");

  // El estado de la nube se carga en el servidor (con la sesión admin) y se
  // vuelca al store una vez, al montar.
  useHidratarNube(estadoInicial);

  const hayDatos = !!filasDropi || !!filasEffi;

  const entrada = useMemo(
    () => ({
      filasDropi,
      filasEffi,
      listaEstatus,
      listaVend,
      descartarNovedad,
      diasManuales,
      corteJornada,
    }),
    [filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad, diasManuales, corteJornada]
  );

  const resultado = useMemo(() => calcular(entrada), [entrada]);
  const diagnostico = useMemo(() => diagnosticar(entrada), [entrada]);

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
      <section>
        <h1 className="mb-1 text-[26px] font-black tracking-tight text-d-txt">
          1 · Cargar y validar
        </h1>
        <p className="text-sm text-d-txt-2">
          Sube los dos Excel; los números se recalculan solos. Los paneles de jornadas y cierre de
          abajo muestran lo que ya está guardado en la nube (solo lectura por ahora).
        </p>
      </section>

      {nubeError && (
        <div className="rounded-card-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-d-txt">
          No se pudo leer el estado guardado en la nube. Podés cargar y validar los Excel igual, pero
          los paneles de jornadas y cierre pueden salir vacíos.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-6 rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <CargadorTodo
          estadoDropi={estadoDropi}
          estadoEffi={estadoEffi}
          onEstadoDropi={ponerEstadoDropi}
          onEstadoEffi={ponerEstadoEffi}
          onFilasDropi={cargarDropi}
          onFilasEffi={cargarEffi}
        />
        {hayDatos && <ResumenCarga resultado={resultado} />}
      </div>

      {hayDatos && (
        <>
          <ResumenVigencia />
          <Filtros />
          <TablaPorDia resultado={resultado} />
          <div className="grid gap-6 lg:grid-cols-2">
            <RankingTabla
              titulo="Ranking de vendedores — Effi (propias)"
              mapa={resultado.porVendedorEffi}
              etiqueta="Vendedor"
              aclaracion="Sale de la columna Vendedor del Excel de Effi."
            />
            <RankingTabla
              titulo="Ranking de tiendas — Dropi"
              mapa={resultado.porTienda}
              etiqueta="Tienda"
              aclaracion="En Dropi la tienda es el vendedor. Va aparte del de Effi y nunca se suman."
            />
          </div>
          <Descartes diagnostico={diagnostico} />
        </>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DiasNoLaborablesPanel />
        <DiaNuloPanel />
      </div>

      <section>
        <div className="flex border-b border-d-sup-3">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "px-5 py-2.5 text-[13px] font-semibold",
                i > 0 ? "border-l border-d-sup-3" : "",
                tab === t.id
                  ? "-mb-px rounded-t-lg border-t border-r border-d-sup-3 bg-d-sup text-turquesa-prof"
                  : "text-d-txt-2 hover:bg-d-sup-2",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {tab === "metas-corte" && (
            <>
              <MetasPanel />
              <CorteJornadaPanel />
            </>
          )}
          {tab === "jornadas-cierre" && (
            <>
              <JornadasPanel resultado={resultado} />
              <CierrePanel />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
