/**
 * Festivos de Colombia, calculados en vivo (Pascua vía Gauss/Meeus + fechas
 * fijas + fechas trasladadas al lunes). Ver ../../docs/BUSINESS-RULES.md
 * regla 2 — incluye el festivo "Virgen de Chiquinquirá" desde 2026.
 *
 * TODO Fase 2: portar festivosColombia()/pascua()/porQueNoLaborable() desde
 * quin-admin.html:527-555. Validar los 19 festivos de 2026 contra
 * pruebas/test-motor-real.js antes de dar por buena la implementación.
 */
export function festivosColombia(_anio: number): Map<string, string> {
  throw new Error("TODO Fase 2: portar festivosColombia() desde quin-admin.html:527");
}

export function porQueNoLaborable(_claveFecha: string): string | null {
  throw new Error("TODO Fase 2: portar porQueNoLaborable() desde quin-admin.html:547");
}
