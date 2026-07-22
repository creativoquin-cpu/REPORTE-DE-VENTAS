"use client";

import { useMemo } from "react";
import { calcular, diagnosticar } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { CargadorExcel } from "./CargadorExcel";
import { Filtros } from "./Filtros";
import { ResumenCarga } from "./ResumenCarga";
import { TablaPorDia } from "./TablaPorDia";
import { RankingTabla } from "./RankingTabla";
import { Descartes } from "./Descartes";

/**
 * Pestaña 1 · Cargar y validar (Fase 4a). Orquesta la carga de los dos Excel,
 * los filtros y las tablas de validación. Todo recalcula en vivo con el motor
 * puro (calcular/diagnosticar) — sin escribir a la nube todavía.
 *
 * Aún faltan de esta pestaña (sub-entregas siguientes): cierre mensual +
 * sync (4b), panel de metas (4c) y el editor de días no laborables (4d). Por
 * eso `diasManuales` va vacío: el motor solo aplica los no laborables
 * automáticos (sábados, domingos y festivos de Colombia).
 */
export function PanelCargar() {
  const {
    filasDropi,
    filasEffi,
    estadoDropi,
    estadoEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    ponerEstadoDropi,
    ponerEstadoEffi,
    cargarDropi,
    cargarEffi,
  } = useCargar();

  const hayDatos = !!filasDropi || !!filasEffi;

  const entrada = useMemo(
    () => ({
      filasDropi,
      filasEffi,
      listaEstatus,
      listaVend,
      descartarNovedad,
      diasManuales: {},
    }),
    [filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad]
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
          Sube los dos Excel; los números se recalculan solos. Todavía no guarda nada en la nube —
          eso es el cierre mensual (siguiente sub-entrega).
        </p>
      </section>

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
    </div>
  );
}
