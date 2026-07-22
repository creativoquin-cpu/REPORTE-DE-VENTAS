import { create } from "zustand";
import {
  identificar,
  fusionar,
  APAGADO_DROPI,
  APAGADO_EFFI,
  type FilaExcel,
  type ItemFiltro,
} from "@/lib/motor";
import type { Jornada, MesCerrado, Meta } from "@/types/database";
import type { EstadoAdminInicial } from "@/lib/data/admin";

/**
 * Estado de la pestaña "Cargar y validar". Puerto de las variables globales de
 * quin-admin.html (filas/listas/ajustes + jornadas/meses/diasManuales) y de
 * construirFiltros()/cargarNube().
 *
 * Fase 4a: carga de Excel + filtros + cálculo, solo cliente.
 * Fase 4b-1: se hidrata con el estado real de la nube (jornadas oficiales,
 * sellos mensuales, días no laborables y ajustes guardados), todo de SOLO
 * LECTURA. Las escrituras (cerrar/reabrir/sellar) llegan en 4b-2.
 */

export type EstadoArchivo = { texto: string; tipo: "" | "leyendo" | "ok" | "err" };

const SIN_ESTADO: EstadoArchivo = { texto: "", tipo: "" };

interface CargarState {
  // --- carga de Excel + filtros (4a) ---
  filasDropi: FilaExcel[] | null;
  filasEffi: FilaExcel[] | null;
  estadoDropi: EstadoArchivo;
  estadoEffi: EstadoArchivo;
  listaEstatus: ItemFiltro[];
  listaVend: ItemFiltro[];
  descartarNovedad: boolean;

  // --- estado de la nube (4b-1, solo lectura) ---
  jornadas: Record<string, Jornada>;
  metas: Meta[];
  meses: Record<string, MesCerrado>;
  diasManuales: Record<string, true>;
  hidratado: boolean;
  nubeError: boolean;
  /** Toggles de filtros guardados en la nube (valor→cuenta), para sembrar. */
  ajustesEst: Record<string, boolean>;
  ajustesVen: Record<string, boolean>;

  // --- escritura (4b-2) ---
  /** "preview" = dry-run (default, no escribe); "vivo" = escribe a producción. */
  modoEscritura: "preview" | "vivo";

  hidratarNube: (e: EstadoAdminInicial) => void;
  setModoEscritura: (m: "preview" | "vivo") => void;
  /** Refleja localmente un cierre ya confirmado en la nube. */
  aplicarCierreLocal: (filas: Jornada[]) => void;
  /** Refleja localmente una reapertura ya confirmada en la nube. */
  aplicarReaperturaLocal: (fecha: string) => void;
  /** Refleja localmente un sellado/reapertura de mes ya confirmado. */
  aplicarSelloLocal: (mes: MesCerrado) => void;
  /** Refleja localmente una meta guardada (nueva o reemplazo por id). */
  aplicarGuardarMetaLocal: (meta: Meta) => void;
  /** Refleja localmente una meta quitada por id. */
  aplicarQuitarMetaLocal: (id: number) => void;
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
 * Recalcula las listas de filtros desde las filas actuales, preservando las
 * decisiones del admin (las de esta sesión y las guardadas en la nube).
 * Equivale a construirFiltros() con `ajustesGuardados.est/ven`.
 */
function reconstruir(
  filasDropi: FilaExcel[] | null,
  filasEffi: FilaExcel[] | null,
  listaEstatus: ItemFiltro[],
  listaVend: ItemFiltro[],
  ajustesEst: Record<string, boolean>,
  ajustesVen: Record<string, boolean>
): Pick<CargarState, "listaEstatus" | "listaVend"> {
  return {
    listaEstatus: fusionar(
      identificar(filasDropi, "ESTATUS", "CANTIDAD", APAGADO_DROPI, "(sin estatus)"),
      listaEstatus,
      ajustesEst
    ),
    listaVend: fusionar(
      identificar(filasEffi, "Vendedor", "Cantidad", APAGADO_EFFI, "(sin vendedor)"),
      listaVend,
      ajustesVen
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

  jornadas: {},
  metas: [],
  meses: {},
  diasManuales: {},
  hidratado: false,
  nubeError: false,
  ajustesEst: {},
  ajustesVen: {},
  modoEscritura: "preview",

  setModoEscritura: (modoEscritura) => set({ modoEscritura }),
  aplicarCierreLocal: (filas) =>
    set((s) => {
      const jornadas = { ...s.jornadas };
      filas.forEach((f) => (jornadas[f.fecha] = f));
      return { jornadas };
    }),
  aplicarReaperturaLocal: (fecha) =>
    set((s) => {
      const jornadas = { ...s.jornadas };
      delete jornadas[fecha];
      return { jornadas };
    }),
  aplicarSelloLocal: (mes) => set((s) => ({ meses: { ...s.meses, [mes.mes]: mes } })),
  aplicarGuardarMetaLocal: (meta) =>
    set((s) => ({ metas: [...s.metas.filter((m) => m.id !== meta.id), meta] })),
  aplicarQuitarMetaLocal: (id) => set((s) => ({ metas: s.metas.filter((m) => m.id !== id) })),

  hidratarNube: (e) =>
    set((s) => {
      const jornadas: Record<string, Jornada> = {};
      e.jornadas.forEach((j) => (jornadas[j.fecha] = j));
      const meses: Record<string, MesCerrado> = {};
      e.meses.forEach((m) => (meses[m.mes] = m));
      const diasManuales: Record<string, true> = {};
      e.diasManuales.forEach((f) => (diasManuales[f] = true));
      const aj = e.ajustes ?? {};
      const ajustesEst = aj.est ?? {};
      const ajustesVen = aj.ven ?? {};
      const descartarNovedad =
        typeof aj.descartarNovedad === "boolean" ? aj.descartarNovedad : s.descartarNovedad;
      // Los días manuales de los ajustes también cuentan (el app viejo los
      // guardaba en ajustes.datos.diasManuales además de la tabla).
      Object.keys(aj.diasManuales ?? {}).forEach((f) => (diasManuales[f] = true));

      return {
        jornadas,
        metas: e.metas,
        meses,
        diasManuales,
        descartarNovedad,
        ajustesEst,
        ajustesVen,
        hidratado: true,
        nubeError: e.error,
        ...reconstruir(s.filasDropi, s.filasEffi, s.listaEstatus, s.listaVend, ajustesEst, ajustesVen),
      };
    }),

  ponerEstadoDropi: (estadoDropi) => set({ estadoDropi }),
  ponerEstadoEffi: (estadoEffi) => set({ estadoEffi }),

  cargarDropi: (filas) =>
    set((s) => ({
      filasDropi: filas,
      ...reconstruir(filas, s.filasEffi, s.listaEstatus, s.listaVend, s.ajustesEst, s.ajustesVen),
    })),
  cargarEffi: (filas) =>
    set((s) => ({
      filasEffi: filas,
      ...reconstruir(s.filasDropi, filas, s.listaEstatus, s.listaVend, s.ajustesEst, s.ajustesVen),
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
