import { describe, it, expect } from "vitest";
import { jornadaDe, fechaEffi } from "./jornada";

// Portado de pruebas/test-motor-real.js §8 y §9.

describe("jornadaDe — bordes del turno (corte 8am, 7am los sábados)", () => {
  const casos: Array<[string, number, number, number, number, string]> = [
    ["sábado 11-jul 06:59 cae en el viernes", 2026, 7, 11, 6.983, "2026-07-10"],
    ["sábado 11-jul 07:01 es ya el sábado", 2026, 7, 11, 7.017, "2026-07-11"],
    ["domingo 12-jul 07:59 cuenta como sábado", 2026, 7, 12, 7.983, "2026-07-11"],
    ["martes 14-jul 08:01 es su propio día", 2026, 7, 14, 8.017, "2026-07-14"],
    ["martes 14-jul 07:59 cuenta como el lunes", 2026, 7, 14, 7.983, "2026-07-13"],
  ];
  it.each(casos)("%s", (_nombre, y, m, d, hora, esperado) => {
    expect(jornadaDe(y, m, d, hora)).toBe(esperado);
  });
});

describe("fechaEffi — la fecha de Effi en todos los formatos", () => {
  const casos: Array<[string, Date | string | null, string | null]> = [
    ["fecha como Date, 2am del sábado → viernes", new Date(2026, 6, 11, 2, 0), "2026-07-10"],
    ["fecha como Date, 8am del sábado → sábado", new Date(2026, 6, 11, 8, 0), "2026-07-11"],
    ["texto AAAA-MM-DD con hora de madrugada", "2026-07-11 02:00:28", "2026-07-10"],
    ["texto AAAA-MM-DD con hora de la tarde", "2026-07-11 15:20:00", "2026-07-11"],
    ["texto DD/MM/AAAA con hora de madrugada", "11/07/2026 03:15", "2026-07-10"],
    ["texto sin hora se queda en su día", "2026-07-11", "2026-07-11"],
    ["martes 07:59 → lunes", "2026-07-14 07:59:00", "2026-07-13"],
    ["martes 08:01 → martes", "2026-07-14 08:01:00", "2026-07-14"],
    ["celda vacía no rompe", null, null],
  ];
  it.each(casos)("%s", (_nombre, celda, esperado) => {
    expect(fechaEffi(celda)).toBe(esperado);
  });
});
