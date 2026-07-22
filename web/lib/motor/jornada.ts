/**
 * Corte de jornada operativa. Ver ../../docs/BUSINESS-RULES.md regla 1.
 * TODO Fase 2: portar jornadaDe/fechaDropi/horaDropi/fechaEffi desde
 * quin-admin.html:466-514 y probar contra pruebas/test-motor-real.js.
 *
 * La jornada corta a las 8am, salvo la madrugada del sábado que corta a las
 * 7am. Aplica a Dropi (fecha+hora) y a Effi (solo si la celda trae hora).
 */
export function jornadaDe(_y: number, _m: number, _d: number, _hora: number | null): string {
  throw new Error("TODO Fase 2: portar jornadaDe() desde quin-admin.html:483");
}
