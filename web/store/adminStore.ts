import { create } from "zustand";
import type { Jornada, Meta, Ajustes, MesCerrado, DiaManual } from "@/types/database";

/**
 * Espejo tipado de las variables globales de quin-admin.html (jornadas,
 * metas, ajustesGuardados, mesesCerrados, diasManuales — ver
 * ../docs/ARCHITECTURE.md sección 4). Se llena de verdad en la Fase 4
 * (auth + pestaña "Cargar y validar"); por ahora declara la forma para que
 * el resto del scaffold pueda tipar contra ella sin adivinar.
 */
interface AdminState {
  jornadas: Record<string, Jornada>;
  metas: Meta[];
  ajustes: Ajustes | null;
  mesesCerrados: Record<string, MesCerrado>;
  diasManuales: Record<string, DiaManual>;
}

export const useAdminStore = create<AdminState>(() => ({
  jornadas: {},
  metas: [],
  ajustes: null,
  mesesCerrados: {},
  diasManuales: {},
}));
