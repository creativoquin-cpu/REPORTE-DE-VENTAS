"use client";

import { useCargar } from "@/lib/store/cargar";
import type { ItemFiltro } from "@/lib/motor";

/**
 * "Qué cuenta y qué no": las dos listas (estatus de Dropi, vendedores de Effi)
 * con casillas para prender/apagar cada valor, más el descarte de NOVEDAD.
 * Puerto de construirFiltros()/bloqueLista() (quin-admin.html:1031-1082).
 */
function ListaFiltro({
  titulo,
  lista,
  vacio,
  onToggle,
  onTodos,
}: {
  titulo: string;
  lista: ItemFiltro[];
  vacio: boolean;
  onToggle: (i: number) => void;
  onTodos: (cuenta: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-d-txt">
        {titulo}
        {!vacio && <span className="ml-1 font-normal text-d-txt-2">({lista.length})</span>}
      </label>
      {vacio || !lista.length ? (
        <div className="rounded-card-sm border border-d-sup-3 bg-d-sup-3 px-4 py-6 text-center text-[13px] text-d-txt-2">
          Carga el archivo para ver la lista
        </div>
      ) : (
        <>
          <div className="mb-1.5 flex gap-2 text-[12px]">
            <button
              onClick={() => onTodos(true)}
              className="rounded-md px-2 py-1 font-semibold text-turquesa hover:bg-d-sup-2"
            >
              marcar todos
            </button>
            <button
              onClick={() => onTodos(false)}
              className="rounded-md px-2 py-1 font-semibold text-turquesa hover:bg-d-sup-2"
            >
              desmarcar todos
            </button>
          </div>
          <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto pr-1">
            {lista.map((x, i) => (
              <label
                key={x.valor}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border border-d-sup-3 px-3 py-2 text-sm ${
                  x.cuenta ? "bg-d-sup-2 text-d-txt" : "bg-d-sup-3 text-d-txt-2 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={x.cuenta}
                  onChange={() => onToggle(i)}
                  className="h-4 w-4 accent-turquesa"
                />
                <span className="flex-1 break-words">{x.valor}</span>
                <span className="shrink-0 text-[12px] text-d-txt-2">{x.prendas} prendas</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Filtros() {
  const {
    filasDropi,
    filasEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    toggleEstatus,
    toggleVend,
    marcarTodosEstatus,
    marcarTodosVend,
    setDescartarNovedad,
  } = useCargar();

  if (!filasDropi && !filasEffi) return null;

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Qué cuenta y qué no</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-4 text-[13px] text-d-txt-2">
          Esta lista sale de <b className="text-d-txt">tus propios archivos</b>. Lo{" "}
          <b className="text-d-txt">marcado</b> cuenta como venta; lo{" "}
          <b className="text-d-txt">desmarcado</b> se descarta. Los números se recalculan solos.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <ListaFiltro
              titulo="Estatus encontrados en Dropi"
              lista={listaEstatus}
              vacio={!filasDropi}
              onToggle={toggleEstatus}
              onTodos={marcarTodosEstatus}
            />
            <label className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-lg border border-d-sup-3 px-3 py-2 text-sm text-d-txt">
              <input
                type="checkbox"
                checked={descartarNovedad}
                onChange={(e) => setDescartarNovedad(e.target.checked)}
                className="h-4 w-4 accent-turquesa"
              />
              <span>Descartar también las filas con algo escrito en la columna NOVEDAD</span>
            </label>
          </div>
          <ListaFiltro
            titulo="Vendedores encontrados en Effi"
            lista={listaVend}
            vacio={!filasEffi}
            onToggle={toggleVend}
            onTodos={marcarTodosVend}
          />
        </div>
      </div>
    </section>
  );
}
