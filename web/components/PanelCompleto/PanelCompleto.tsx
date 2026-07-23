"use client";

import type { ReactNode } from "react";
import { PanelCargar } from "@/components/Cargar";
import { TableroPanel } from "@/components/Tablero";
import { CalendarioPanel } from "@/components/Calendario";
import { ComparativoPanel } from "@/components/Comparativo";
import type { EstadoAdminInicial } from "@/lib/data/admin";

/**
 * Panel de administrador en UNA sola página que baja en scroll: las cinco
 * secciones (Cargar, Tablero, Calendario, Comparativo, Vista del vendedor)
 * apiladas de arriba a abajo, sin pestañas ni botones de navegación.
 * Reemplaza el ruteo por pestañas anterior (una ruta por sección).
 *
 * `vistaVendedor` llega como slot desde el Server Component de la página,
 * porque <VistaEquipo> es un Server Component asíncrono y no puede renderizarse
 * dentro de este Client Component; se pasa ya renderizado desde el servidor.
 *
 * Las cuatro secciones cliente reciben el mismo `estadoInicial` y cada una
 * llama a useHidratarNube; el hook deduplica, así que solo la primera hidrata.
 */
function Separador() {
  return <hr className="my-2 border-t border-d-sup-3" />;
}

export function PanelCompleto({
  estadoInicial,
  vistaVendedor,
}: {
  estadoInicial: EstadoAdminInicial;
  vistaVendedor: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-12">
      <section id="cargar">
        <PanelCargar estadoInicial={estadoInicial} />
      </section>
      <Separador />
      <section id="tablero">
        <TableroPanel estadoInicial={estadoInicial} />
      </section>
      <Separador />
      <section id="calendario">
        <CalendarioPanel estadoInicial={estadoInicial} />
      </section>
      <Separador />
      <section id="comparativo">
        <ComparativoPanel estadoInicial={estadoInicial} />
      </section>
      <Separador />
      <section id="vista-vendedor">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="mb-1 text-[26px] font-black tracking-tight text-d-txt">
            5 · Vista del vendedor
          </h1>
          <p className="mb-4 text-sm text-d-txt-2">
            Lo mismo que ve el equipo en la página pública, sin cifras por persona.
          </p>
        </div>
        {vistaVendedor}
      </section>
    </div>
  );
}
