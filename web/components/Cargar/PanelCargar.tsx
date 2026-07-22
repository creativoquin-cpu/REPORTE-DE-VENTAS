"use client";

import { useEffect, useMemo } from "react";
import { calcular, diagnosticar } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import type { EstadoAdminInicial } from "@/lib/data/admin";
import { CargadorExcel } from "./CargadorExcel";
import { Filtros } from "./Filtros";
import { ResumenCarga } from "./ResumenCarga";
import { TablaPorDia } from "./TablaPorDia";
import { RankingTabla } from "./RankingTabla";
import { Descartes } from "./Descartes";
import { MetasPanel } from "./MetasPanel";
import { DiasNoLaborablesPanel } from "./DiasNoLaborablesPanel";
import { JornadasPanel } from "./JornadasPanel";
import { CierrePanel } from "./CierrePanel";

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
    nubeError,
    ponerEstadoDropi,
    ponerEstadoEffi,
    cargarDropi,
    cargarEffi,
    hidratarNube,
  } = useCargar();

  // El estado de la nube se carga en el servidor (con la sesión admin) y se
  // vuelca al store una vez, al montar.
  useEffect(() => {
    hidratarNube(estadoInicial);
  }, [estadoInicial, hidratarNube]);

  const hayDatos = !!filasDropi || !!filasEffi;

  const entrada = useMemo(
    () => ({
      filasDropi,
      filasEffi,
      listaEstatus,
      listaVend,
      descartarNovedad,
      diasManuales,
    }),
    [filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad, diasManuales]
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

      <div className="flex flex-wrap gap-6 rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <CargadorExcel
          titulo="Excel de Dropi"
          pista="(ordenes_productos…)"
          estado={estadoDropi}
          onEstado={ponerEstadoDropi}
          onFilas={cargarDropi}
        />
        <CargadorExcel
          titulo="Excel de Effi"
          pista="(Reporte de conceptos…)"
          estado={estadoEffi}
          onEstado={ponerEstadoEffi}
          onFilas={cargarEffi}
        />
        {hayDatos && <ResumenCarga resultado={resultado} />}
      </div>

      {hayDatos && (
        <>
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

      <MetasPanel />
      <DiasNoLaborablesPanel />
      <JornadasPanel resultado={resultado} />
      <CierrePanel />
    </div>
  );
}
