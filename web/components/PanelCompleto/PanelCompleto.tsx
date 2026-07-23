"use client";

import { PanelCargar } from "@/components/Cargar";
import { TableroPanel } from "@/components/Tablero";
import { CalendarioPanel } from "@/components/Calendario";
import { ComparativoPanel } from "@/components/Comparativo";
import type { EstadoAdminInicial } from "@/lib/data/admin";

/**
 * Panel de administrador en UNA sola página que baja en scroll: las secciones
 * (Cargar, Tablero, Calendario, Comparativo) apiladas de arriba a abajo, sin
 * pestañas ni botones de navegación. Reemplaza el ruteo por pestañas anterior.
 *
 * La "Vista del vendedor" NO va acá: es lo que ve el equipo y vive en la página
 * pública "/". El panel del admin es solo herramientas del administrador.
 *
 * Las secciones reciben el mismo `estadoInicial` y cada una llama a
 * useHidratarNube; el hook deduplica, así que solo la primera hidrata.
 */
function Separador() {
  return <hr className="my-2 border-t border-d-sup-3" />;
}

export function PanelCompleto({ estadoInicial }: { estadoInicial: EstadoAdminInicial }) {
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
    </div>
  );
}
