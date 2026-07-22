import { create } from "zustand";

/**
 * Estado de UI efímero compartido entre componentes (Zustand). Las 5
 * "pestañas" del admin original ahora son rutas reales
 * (/admin/cargar, /admin/tablero...), así que ya no hace falta guardar acá
 * "pestaña activa" — Next.js lo resuelve con el router (ver AdminNav).
 *
 * Este store queda como base mínima para estado que sí necesite
 * compartirse entre componentes hermanos, como la selección del
 * calendario en la Fase 6 (equivalente a calSel en quin-admin.html:601).
 */
interface UIState {
  calendarioSeleccion: string[];
  setCalendarioSeleccion: (fechas: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  calendarioSeleccion: [],
  setCalendarioSeleccion: (fechas) => set({ calendarioSeleccion: fechas }),
}));
