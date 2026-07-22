import { create } from "zustand";
import {
  identificar,
  fusionar,
  APAGADO_DROPI,
  APAGADO_EFFI,
  type FilaExcel,
  type ItemFiltro,
} from "@/lib/motor";

/**
 * Estado de la pestaña "Cargar y validar" (Fase 4a). Puerto de las variables
 * globales `filasDropi`/`filasEffi`/`listaEstatus`/`listaVend`/`descartarNovedad`
 * de quin-admin.html:580-593, más `construirFiltros()` (1031-1035).
 *
 * Por ahora es solo cliente y de solo lectura: no escribe a la nube ni edita
 * días no laborables (eso llega en 4b/4c/4d). `diasManuales` queda vacío, así
 * que el motor solo aplica sábados/domingos/festivos automáticos.
 */

export type EstadoArchivo = { texto: string; tipo: "" | "leyendo" | "ok" | "err" };

const SIN_ESTADO: EstadoArchivo = { texto: "", tipo: "" };

interface CargarState {
  filasDropi: FilaExcel[] | null;
  filasEffi: FilaExcel[] | null;
  estadoDropi: EstadoArchivo;
  estadoEffi: EstadoArchivo;
  listaEstatus: ItemFiltro[];
  listaVend: ItemFiltro[];
  descartarNovedad: boolean;

  ponerEstadoDropi: (e: EstadoArchivo) => void;
  ponerEstadoEffi: (e: EstadoArchivo) => void;
  cargarDropi: (filas: FilaExcel[] | null) => void;
  cargarEffi: (filas: FilaExcel[] | null) => void;
  toggleEstatus: (i: number) => void;
  toggleVend: (i: number) => void;
  marcarTodosEstatus: (cuenta: boolean) => void;
  marcarTodosVend: (cuenta: boolean) => void;
  setDescartarNovedad: (v: boolean) => void;
}

/**
 * Recalcula ambas listas de filtros a partir de las filas actuales,
 * preservando las decisiones ya tomadas por el admin (fusionar). Equivale a
 * construirFiltros() sin ajustes de nube (esos llegan en 4b).
 */
function reconstruir(
  filasDropi: FilaExcel[] | null,
  filasEffi: FilaExcel[] | null,
  listaEstatus: ItemFiltro[],
  listaVend: ItemFiltro[]
): Pick<CargarState, "listaEstatus" | "listaVend"> {
  return {
    listaEstatus: fusionar(
      identificar(filasDropi, "ESTATUS", "CANTIDAD", APAGADO_DROPI, "(sin estatus)"),
      listaEstatus
    ),
    listaVend: fusionar(
      identificar(filasEffi, "Vendedor", "Cantidad", APAGADO_EFFI, "(sin vendedor)"),
      listaVend
    ),
  };
}

export const useCargar = create<CargarState>((set) => ({
  filasDropi: null,
  filasEffi: null,
  estadoDropi: SIN_ESTADO,
  estadoEffi: SIN_ESTADO,
  listaEstatus: [],
  listaVend: [],
  descartarNovedad: true,

  ponerEstadoDropi: (estadoDropi) => set({ estadoDropi }),
  ponerEstadoEffi: (estadoEffi) => set({ estadoEffi }),

  cargarDropi: (filas) =>
    set((s) => ({
      filasDropi: filas,
      ...reconstruir(filas, s.filasEffi, s.listaEstatus, s.listaVend),
    })),
  cargarEffi: (filas) =>
    set((s) => ({
      filasEffi: filas,
      ...reconstruir(s.filasDropi, filas, s.listaEstatus, s.listaVend),
    })),

  toggleEstatus: (i) =>
    set((s) => ({
      listaEstatus: s.listaEstatus.map((x, j) => (j === i ? { ...x, cuenta: !x.cuenta } : x)),
    })),
  toggleVend: (i) =>
    set((s) => ({
      listaVend: s.listaVend.map((x, j) => (j === i ? { ...x, cuenta: !x.cuenta } : x)),
    })),
  marcarTodosEstatus: (cuenta) =>
    set((s) => ({ listaEstatus: s.listaEstatus.map((x) => ({ ...x, cuenta })) })),
  marcarTodosVend: (cuenta) =>
    set((s) => ({ listaVend: s.listaVend.map((x) => ({ ...x, cuenta })) })),
  setDescartarNovedad: (descartarNovedad) => set({ descartarNovedad }),
}));
